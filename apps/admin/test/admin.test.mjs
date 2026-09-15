import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import http from "node:http";
import { createApp, root } from "../server.mjs";
import { createStore } from "../store.mjs";
import { cleanMarkdown } from "../schema.mjs";

test("authentication, revisioned editing, private uploads and direct publication", async (t) => {
  const parent = await fs.mkdtemp(
    path.join(os.tmpdir(), "inkbrain-admin-test-"),
  );
  const dir = path.join(parent, ".inkbrain");
  await fs.mkdir(dir);
  let fail = false;
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const service = await createApp({
    dir,
    origin,
    password: "test-only-password-123",
    uploadLimit: 1024,
    documentLimit: 256,
    buildOverride: async (stage) => {
      if (fail) throw Error("intentional test failure");
      await fs.mkdir(path.join(stage, "dist"), { recursive: true });
      await fs.cp(path.join(stage, "public"), path.join(stage, "dist"), {
        recursive: true,
      });
      const state = JSON.parse(
        await fs.readFile(path.join(stage, "content.json"), "utf8"),
      );
      await fs.writeFile(
        path.join(stage, "dist/index.html"),
        `<h1>${state.settings.tagline}</h1>`,
      );
    },
  });
  server.on("request", service.app);
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(parent, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "",
    csrf = "";
  const request = (url, method = "GET", body, headers = {}) =>
    fetch(base + url, {
      method,
      headers: {
        Host: new URL(origin).host,
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        "X-CSRF-Token": csrf,
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  assert.match(
    (await request("/admin/")).headers.get("content-security-policy"),
    /img-src[^;]*blob:/,
  );
  assert.equal((await request("/admin/api/state")).status, 401);
  assert.equal(
    (
      await request(
        "/admin/api/login",
        "POST",
        { password: "test-only-password-123" },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  const login = await request("/admin/api/login", "POST", {
    password: "test-only-password-123",
  });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  csrf = (await login.json()).csrf;
  let state = (await (await request("/admin/api/state")).json()).state;
  assert.equal(state.tags.length, 6);
  assert.equal(
    (
      await request(
        "/admin/api/settings",
        "PUT",
        { revision: state.revision, settings: state.settings },
        { "X-CSRF-Token": "" },
      )
    ).status,
    403,
  );
  const edited = { ...state.settings, tagline: "Test publication one" };
  const saved = await request("/admin/api/settings", "PUT", {
    revision: state.revision,
    settings: edited,
  });
  assert.equal(saved.status, 200);
  state = (await saved.json()).state;
  const managedTags = structuredClone(state.tags);
  managedTags[0].label = "Agent Architecture";
  managedTags.push({ slug: "tooling", label: "Tooling" });
  const tagsSaved = await request("/admin/api/tags", "PUT", {
    revision: state.revision,
    tags: managedTags,
  });
  assert.equal(tagsSaved.status, 200);
  state = (await tagsSaved.json()).state;
  assert.equal(state.tags.at(-1).slug, "tooling");
  const usedTag = state.articles[0].data.tags[0];
  assert.equal(
    (
      await request("/admin/api/tags", "PUT", {
        revision: state.revision,
        tags: state.tags.filter((tag) => tag.slug !== usedTag),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/admin/api/settings", "PUT", {
        revision: state.revision - 1,
        settings: edited,
      })
    ).status,
    409,
  );
  const reopened = await createStore(dir, path.join(root, "apps/web"));
  assert.equal((await reopened.read()).settings.tagline, edited.tagline);
  const invalid = structuredClone(state.projects[0]);
  invalid.data.repositoryUrl = "javascript:alert(1)";
  assert.equal(
    (
      await request(`/admin/api/records/projects/${invalid.id}`, "PUT", {
        revision: state.revision,
        record: invalid,
      })
    ).status,
    400,
  );
  const data = new FormData();
  const project = structuredClone(state.projects[0]);
  project.data.license = "Apache-2.0";
  project.data.languages = ["Rust", "TypeScript"];
  project.data.repositoryUrls = [
    "https://github.com/example/core",
    "https://github.com/example/sdk",
  ];
  project.data.documentationUrls = [
    "https://example.com/guide",
    "https://example.com/api",
  ];
  const projectSaved = await request(
    `/admin/api/records/projects/${project.id}`,
    "PUT",
    {
      revision: state.revision,
      record: project,
    },
  );
  assert.equal(projectSaved.status, 200);
  state = (await projectSaved.json()).state;
  assert.equal(state.projects.find((item) => item.id === project.id).data.license, "Apache-2.0");
  assert.deepEqual(state.projects.find((item) => item.id === project.id).data.languages, ["Rust", "TypeScript"]);
  assert.deepEqual(
    state.projects.find((item) => item.id === project.id).data.repositoryUrls,
    project.data.repositoryUrls,
  );
  assert.deepEqual(
    state.projects.find((item) => item.id === project.id).data
      .documentationUrls,
    project.data.documentationUrls,
  );
  project.data.documentationUrls = ["javascript:alert(1)"];
  assert.equal(
    (
      await request(`/admin/api/records/projects/${project.id}`, "PUT", {
        revision: state.revision,
        record: project,
      })
    ).status,
    400,
  );
  data.append("file", new Blob(["test-package"]), "example.zip");
  const uploaded = await request("/admin/api/assets", "POST", data);
  assert.equal(uploaded.status, 201);
  const asset = await uploaded.json();
  assert.equal(
    asset.sha256,
    createHash("sha256").update("test-package").digest("hex"),
  );
  assert.equal(
    (
      await request("/admin/api/assets/" + asset.filename, "GET", undefined, {
        Cookie: "",
      })
    ).status,
    401,
  );
  assert.equal(
    await (await request("/admin/api/assets/" + asset.filename)).text(),
    "test-package",
  );
  const huge = new FormData();
  huge.append("file", new Blob([Buffer.alloc(1025)]), "large.zip");
  assert.equal((await request("/admin/api/assets", "POST", huge)).status, 400);
  const svg = new FormData();
  svg.append("file", new Blob(["<svg/>"]), "bad.svg");
  assert.equal((await request("/admin/api/assets", "POST", svg)).status, 400);
  const htmlUpload = new FormData();
  htmlUpload.append(
    "file",
    new Blob([
      '<h2>Safe heading</h2><script>alert(1)</script><img src="x" onerror="alert(1)">',
    ]),
    "draft.html",
  );
  const htmlResponse = await request("/admin/api/assets", "POST", htmlUpload);
  const htmlAsset = await htmlResponse.json();
  assert.equal(htmlResponse.status, 201, JSON.stringify(htmlAsset));
  assert.equal(htmlAsset.type, "text/html");
  const sourceResponse = await request(
    `/admin/api/assets/${htmlAsset.filename}/source`,
  );
  assert.equal(sourceResponse.status, 200);
  assert.match((await sourceResponse.json()).source, /<script>/);
  assert.equal(
    (
      await request(
        `/admin/api/assets/${htmlAsset.filename}/preview`,
        "GET",
        undefined,
        { Cookie: "" },
      )
    ).status,
    401,
  );
  const safePreview = await (
    await request(`/admin/api/assets/${htmlAsset.filename}/preview`)
  ).text();
  assert.match(safePreview, /Safe heading/);
  assert.doesNotMatch(safePreview, /<script|onerror/i);
  const deletedDocument = await request(
    `/admin/api/assets/${htmlAsset.filename}`,
    "DELETE",
    {},
  );
  assert.equal(deletedDocument.status, 200);
  assert.equal(
    (await deletedDocument.json()).assets.some(
      (entry) => entry.filename === htmlAsset.filename,
    ),
    false,
  );
  assert.equal(
    (await request(`/admin/api/assets/${htmlAsset.filename}`)).status,
    404,
  );
  const markdownUpload = new FormData();
  markdownUpload.append(
    "file",
    new Blob(["---\ntitle: Metadata\n---\n## Imported Markdown"]),
    "draft.md",
  );
  const markdownResponse = await request(
    "/admin/api/assets",
    "POST",
    markdownUpload,
  );
  assert.equal(markdownResponse.status, 201);
  const markdownAsset = await markdownResponse.json();
  assert.equal(markdownAsset.type, "text/markdown");
  const markdownSource = await (
    await request(`/admin/api/assets/${markdownAsset.filename}/source`)
  ).json();
  assert.match(markdownSource.source, /^## Imported Markdown/);
  assert.doesNotMatch(markdownSource.source, /Metadata/);
  const binaryDocument = new FormData();
  binaryDocument.append("file", new Blob(["hello\0world"]), "binary.md");
  assert.equal(
    (await request("/admin/api/assets", "POST", binaryDocument)).status,
    400,
  );
  const invalidUtf8 = new FormData();
  invalidUtf8.append(
    "file",
    new Blob([Buffer.from([0xc3, 0x28])]),
    "invalid.md",
  );
  assert.equal(
    (await request("/admin/api/assets", "POST", invalidUtf8)).status,
    400,
  );
  const oversizedDocument = new FormData();
  oversizedDocument.append(
    "file",
    new Blob(["x".repeat(257)]),
    "oversized.html",
  );
  assert.equal(
    (await request("/admin/api/assets", "POST", oversizedDocument)).status,
    413,
  );
  const imagePreview = await request("/admin/api/markdown", "POST", {
    body: "![Draft image](/media/example.png)",
  });
  assert.match(
    (await imagePreview.json()).html,
    /src="\/admin\/api\/assets\/example\.png"/,
  );
  const record = structuredClone(state.tools[0]);
  record.data.availability = "available";
  record.data.release.downloadUrl = asset.url;
  record.data.release.checksum = asset.sha256;
  state = (
    await (
      await request(`/admin/api/records/tools/${record.id}`, "PUT", {
        revision: state.revision,
        record,
      })
    ).json()
  ).state;
  const referencedDelete = await request(
    `/admin/api/assets/${asset.filename}`,
    "DELETE",
    {},
  );
  assert.equal(referencedDelete.status, 409);
  assert.match((await referencedDelete.json()).error, /仍被草稿内容引用/);
  assert.equal((await request(asset.url)).status, 503);
  let task = await service.publisher.start(state);
  await task.promise;
  const first = service.publisher.current();
  assert.ok(first);
  assert.match(
    await fs.readFile(
      path.join(
        service.publisher.releaseRoot,
        first.id,
        "src/data/taxonomy.ts",
      ),
      "utf8",
    ),
    /Agent Architecture/,
  );
  assert.equal(await (await request(asset.url)).text(), "test-package");
  assert.equal((await request("/content.json")).status, 404);
  state = (
    await (
      await request("/admin/api/settings", "PUT", {
        revision: state.revision,
        settings: { ...state.settings, tagline: "Test publication two" },
      })
    ).json()
  ).state;
  assert.match(await (await request("/")).text(), /Test publication one/);
  fail = true;
  task = await service.publisher.start(state);
  await task.promise;
  assert.equal(service.publisher.status().status, "failed");
  assert.equal(service.publisher.current().id, first.id);
  fail = false;
  task = await service.publisher.start(state);
  await assert.rejects(service.publisher.start(state), /已有构建/);
  await task.promise;
  assert.match(await (await request("/")).text(), /Test publication two/);
  const deletedId = state.articles[0].id;
  const previousCount = state.articles.length;
  const result = await request(
    `/admin/api/records/articles/${deletedId}`,
    "DELETE",
    { revision: state.revision },
  );
  assert.equal(result.status, 200);
  state = (await result.json()).state;
  assert.equal(state.articles.length, previousCount - 1);
  assert.equal(
    state.articles.some((record) => record.id === deletedId),
    false,
  );
  assert.equal(
    (
      await request(`/admin/api/records/articles/${deletedId}`, "DELETE", {
        revision: state.revision,
      })
    ).status,
    404,
  );
});

test("Markdown sanitization never retains scripts, events or executable links", () => {
  const html = cleanMarkdown(
    '<script>alert(1)</script>\n<img src="x" onerror="alert(1)">\n\n[bad](javascript:alert(1))',
  );
  assert.doesNotMatch(html, /<script|onerror|javascript:/i);
});

test("real Astro build supports an empty publication without stale demo content", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inkbrain-empty-test-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const service = await createApp({ dir });
  const state = await service.store.read();
  for (const kind of ["articles", "knowledge", "projects", "tools", "skills"])
    state[kind] = [];
  const task = await service.publisher.start(state);
  await task.promise;
  assert.equal(
    service.publisher.status().status,
    "succeeded",
    service.publisher.status().log,
  );
  const dist = path.join(
    service.publisher.releaseRoot,
    service.publisher.current().id,
    "dist",
  );
  assert.doesNotMatch(
    await fs.readFile(path.join(dist, "index.html"), "utf8"),
    /Atlas Agent Framework/,
  );
  await assert.rejects(
    fs.stat(
      path.join(dist, "writing/designing-verifiable-ai-systems/index.html"),
    ),
  );
});
