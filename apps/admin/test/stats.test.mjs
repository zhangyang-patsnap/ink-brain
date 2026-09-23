import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createApp } from "../server.mjs";
import { createStats } from "../stats.mjs";

async function startServer(t, options = {}) {
  const parent = await fs.mkdtemp(
    path.join(os.tmpdir(), "inkbrain-stats-test-"),
  );
  const dir = path.join(parent, ".inkbrain");
  await fs.mkdir(dir);
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const service = await createApp({
    dir,
    origin,
    password: "test-only-password-123",
    buildOverride: async (stage) => {
      await fs.mkdir(path.join(stage, "dist/writing/sample-article"), {
        recursive: true,
      });
      await fs.writeFile(path.join(stage, "dist/index.html"), "<h1>home</h1>");
      await fs.writeFile(
        path.join(stage, "dist/writing/sample-article/index.html"),
        "<h1>article</h1>",
      );
    },
    ...options,
  });
  server.on("request", service.app);
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(parent, { recursive: true, force: true });
  });
  const state = await service.store.read();
  const task = await service.publisher.start(state);
  await task.promise;
  assert.equal(service.publisher.status().status, "succeeded");
  return { service, origin, dir };
}

const request = (origin, url, headers = {}) =>
  fetch(origin + url, { headers: { Host: new URL(origin).host, ...headers } });

test("dedupes site visits by ip+ua per day and filters bots", async (t) => {
  const { service, origin, dir } = await startServer(t);
  await request(origin, "/", { "User-Agent": "Mozilla/5.0 test" });
  await request(origin, "/", { "User-Agent": "Mozilla/5.0 test" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.stats.summary().totalVisitors, 1);
  await request(origin, "/", {
    "User-Agent": "Mozilla/5.0 test",
    "X-Forwarded-For": "203.0.113.9",
  });
  await new Promise((resolve) => setImmediate(resolve));
  // trustProxy is off by default, so a spoofed X-Forwarded-For changes nothing:
  // this request shares the same loopback socket address and UA as the first two.
  assert.equal(service.stats.summary().totalVisitors, 1);
  await request(origin, "/", { "User-Agent": "Mozilla/5.0 other-browser" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.stats.summary().totalVisitors, 2);
  await request(origin, "/", { "User-Agent": "Googlebot/2.1" });
  await request(origin, "/", { "User-Agent": "" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.stats.summary().totalVisitors, 2);
  await service.stats.close();
  const persisted = JSON.parse(
    await fs.readFile(path.join(dir, "stats.json"), "utf8"),
  );
  assert.equal(persisted.totalVisitors, 2);
});

test("counts unique visitors per article, ignoring 404s and non-html", async (t) => {
  const { service, origin } = await startServer(t);
  await request(origin, "/writing/sample-article/", { "User-Agent": "A" });
  await request(origin, "/writing/sample-article/", { "User-Agent": "A" });
  await request(origin, "/writing/sample-article/", { "User-Agent": "B" });
  // Neither a bogus article slug nor a path with no built file is a 200, so
  // neither reaches the finish handler's html/200 check — they must not count.
  await request(origin, "/writing/no-such-article/", { "User-Agent": "C" });
  await request(origin, "/no-such-page", { "User-Agent": "D" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(service.stats.articleVisitors(["sample-article"]), {
    "sample-article": 2,
  });
  assert.equal(service.stats.summary().totalVisitors, 2);
});

test("respects trustProxy for the last X-Forwarded-For hop only when enabled", async (t) => {
  const { service, origin } = await startServer(t, { trustProxy: true });
  await request(origin, "/", {
    "User-Agent": "A",
    "X-Forwarded-For": "198.51.100.1, 203.0.113.9",
  });
  await request(origin, "/", {
    "User-Agent": "A",
    "X-Forwarded-For": "198.51.100.2, 203.0.113.9",
  });
  await new Promise((resolve) => setImmediate(resolve));
  // Same last hop (203.0.113.9) despite a different spoofable first hop → one visitor.
  assert.equal(service.stats.summary().totalVisitors, 1);
  await request(origin, "/", {
    "User-Agent": "A",
    "X-Forwarded-For": "198.51.100.1, 203.0.113.50",
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.stats.summary().totalVisitors, 2);
});

test("public stats endpoints require no auth and never cache", async (t) => {
  const { service, origin } = await startServer(t);
  await request(origin, "/writing/sample-article/", { "User-Agent": "A" });
  await new Promise((resolve) => setImmediate(resolve));
  const summary = await request(origin, "/api/stats/summary");
  assert.equal(summary.status, 200);
  assert.equal(summary.headers.get("cache-control"), "no-store");
  assert.deepEqual(await summary.json(), { totalVisitors: 1 });
  const articles = await request(
    origin,
    "/api/stats/articles?ids=sample-article,Not Valid!,unknown-id",
  );
  assert.equal(articles.status, 200);
  assert.equal(articles.headers.get("cache-control"), "no-store");
  assert.deepEqual(await articles.json(), {
    "sample-article": 1,
    "unknown-id": 0,
  });
});

test("resets daily dedup on rollover without clearing cumulative totals", async () => {
  const parent = await fs.mkdtemp(
    path.join(os.tmpdir(), "inkbrain-stats-clock-"),
  );
  const dir = path.join(parent, ".inkbrain");
  await fs.mkdir(dir);
  let now = new Date("2026-01-01T00:00:00Z");
  const stats = await createStats({ dir, now: () => now });
  stats.recordVisit({ ip: "1.1.1.1", ua: "A", path: "/" });
  stats.recordVisit({ ip: "1.1.1.1", ua: "A", path: "/" });
  assert.equal(stats.summary().totalVisitors, 1);
  now = new Date("2026-01-02T00:00:00Z");
  stats.recordVisit({ ip: "1.1.1.1", ua: "A", path: "/" });
  assert.equal(stats.summary().totalVisitors, 2);
  await stats.close();
  await fs.rm(parent, { recursive: true, force: true });
});

test("a fresh createStats hydrates persisted totals but starts dedup empty", async () => {
  const parent = await fs.mkdtemp(
    path.join(os.tmpdir(), "inkbrain-stats-restart-"),
  );
  const dir = path.join(parent, ".inkbrain");
  await fs.mkdir(dir);
  const first = await createStats({ dir });
  first.recordVisit({ ip: "1.1.1.1", ua: "A", path: "/writing/sample-article/" });
  await first.close();
  const second = await createStats({ dir });
  assert.equal(second.summary().totalVisitors, 1);
  assert.deepEqual(second.articleVisitors(["sample-article"]), {
    "sample-article": 1,
  });
  // Same visitor again after a restart is recounted once: dedup Sets are memory-only.
  second.recordVisit({ ip: "1.1.1.1", ua: "A", path: "/writing/sample-article/" });
  assert.equal(second.summary().totalVisitors, 2);
  await second.close();
  await fs.rm(parent, { recursive: true, force: true });
});
