import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createApp } from "../server.mjs";
import { parseRecord } from "../schema.mjs";
import { publishedRecords, validatePublication } from "../store.mjs";

test("mixed topics migrate, preserve ordering, filter unavailable items and remove deleted references", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inkbrain-topics-"));
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const service = await createApp({
    dir,
    origin,
    password: "topic-test-password",
  });
  server.on("request", service.app);
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dir, { recursive: true, force: true });
  });
  let state = await service.store.read();
  const legacy = {
    ...state.knowledge[0],
    data: {
      title: "旧专题",
      summary: "旧简介",
      references: {
        articles: [state.articles[0].id],
        projects: [state.projects[0].id],
        tools: [state.tools[0].id],
      },
    },
  };
  assert.deepEqual(
    parseRecord("knowledge", legacy, legacy.id).data.items.map(
      (item) => item.kind,
    ),
    ["articles", "projects", "tools"],
  );
  const topic = {
    ...state.knowledge[0],
    data: {
      title: "阅读与实践",
      summary: "从文章走向项目",
      items: [
        { kind: "tools", id: state.tools[0].id },
        { kind: "articles", id: state.articles[0].id },
        { kind: "projects", id: state.projects[0].id },
      ],
    },
  };
  const login = await fetch(origin + "/admin/api/login", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: "topic-test-password" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const { csrf } = await login.json();
  const request = (url, method, body) =>
    fetch(origin + url, {
      method,
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify(body),
    });
  const saved = await request(
    `/admin/api/records/knowledge/${topic.id}`,
    "PUT",
    { revision: state.revision, record: topic },
  );
  assert.equal(saved.status, 200);
  state = (await saved.json()).state;
  assert.deepEqual(
    state.knowledge.find((item) => item.id === topic.id).data.items,
    topic.data.items,
  );
  const duplicate = structuredClone(topic);
  duplicate.data.items.push(duplicate.data.items[0]);
  assert.equal(
    (
      await request(`/admin/api/records/knowledge/${topic.id}`, "PUT", {
        revision: state.revision,
        record: duplicate,
      })
    ).status,
    400,
  );
  const filtered = structuredClone(state);
  filtered.projects[0].included = false;
  for (const tool of filtered.tools) tool.data.relatedProject = "";
  assert.doesNotThrow(() => validatePublication(filtered));
  assert.deepEqual(
    publishedRecords(filtered, "knowledge")
      .find((item) => item.id === topic.id)
      .data.items.map((item) => item.kind),
    ["tools", "articles"],
  );
  const deletedId = state.articles[0].id;
  const removed = await request(
    `/admin/api/records/articles/${deletedId}`,
    "DELETE",
    { revision: state.revision },
  );
  assert.equal(removed.status, 200);
  state = (await removed.json()).state;
  assert.ok(
    state.knowledge.every(
      (item) =>
        !item.data.items.some(
          (ref) => ref.kind === "articles" && ref.id === deletedId,
        ),
    ),
  );
  assert.doesNotThrow(() => validatePublication(state));
  const empty = { ...topic, data: { ...topic.data, items: [] } };
  assert.equal(parseRecord("knowledge", empty, empty.id).data.items.length, 0);
  state.tools[0].data.name = "专题工具的新标题";
  const build = await service.publisher.start(state);
  await build.promise;
  assert.equal(
    service.publisher.status().status,
    "succeeded",
    service.publisher.status().log,
  );
  const html = await fs.readFile(
    path.join(
      service.publisher.releaseRoot,
      service.publisher.current().id,
      "dist",
      "knowledge",
      topic.id,
      "index.html",
    ),
    "utf8",
  );
  assert.ok(html.includes("专题工具的新标题"));
  assert.ok(
    html.indexOf(`href="/tools/${state.tools[0].id}/"`) <
      html.indexOf(`href="/projects/${state.projects[0].id}/"`),
  );
  assert.ok(!html.includes(`href="/writing/${deletedId}/"`));
  const topicDeleted = await request(
    `/admin/api/records/knowledge/${topic.id}`,
    "DELETE",
    { revision: state.revision },
  );
  assert.equal(topicDeleted.status, 200);
  const deletedResult = await topicDeleted.json();
  assert.equal(deletedResult.active.revision, deletedResult.state.revision);
  assert.equal((await fetch(origin + `/knowledge/${topic.id}/`)).status, 404);
  const indexResponse = await fetch(origin + "/knowledge/");
  assert.equal(indexResponse.headers.get("cache-control"), "no-store");
  assert.ok(
    !(await indexResponse.text()).includes(`href="/knowledge/${topic.id}/"`),
  );
});
