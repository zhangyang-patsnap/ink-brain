import express from "express";
import multer from "multer";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { createAuth } from "./auth.mjs";
import { createStore, atomicJson, readJson } from "./store.mjs";
import {
  catalogs,
  kinds,
  parseRecord,
  settingsSchema,
  slug,
  tagListSchema,
  cleanMarkdown,
} from "./schema.mjs";
import { createPublisher } from "./publisher.mjs";
import { inspectSkillPackage } from "./skill-package.mjs";
import { createStats } from "./stats.mjs";

// 校验失败要说清楚是哪个字段、超了多少，而不是把 Zod 的原文抛给作者。
const fieldNames = {
  name: "名称",
  title: "标题",
  summary: "简介",
  version: "版本",
  monogram: "图标字符",
  documentation: "详细说明",
  sourceUrl: "原始链接",
  category: "能力分类",
  order: "排序",
  slug: "页面地址",
  fileUrl: "Skill 文件",
  fileName: "文件名",
  checksum: "SHA-256",
};
function describeIssue(issue) {
  const key = [...issue.path].reverse().find((part) => fieldNames[part]);
  const label = key ? fieldNames[key] : issue.path.join(".") || "内容";
  if (issue.code === "too_big" && typeof issue.maximum === "number")
    return `${label}最多 ${issue.maximum} 个字符`;
  if (issue.code === "too_small" && issue.minimum === 1) return `${label}不能为空`;
  if (issue.code === "too_small" && typeof issue.minimum === "number")
    return `${label}至少 ${issue.minimum} 个字符`;
  return `${label}：${issue.message}`;
}

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "../..");
const imageTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
const documentTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
};
const extensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".dmg",
  ".zip",
  ".tar.gz",
  ".tgz",
  ".pdf",
  ".vsix",
  ".html",
  ".htm",
  ".md",
  ".markdown",
  ".skill",
];
// 明显的爬虫和脚本 UA，不计入访问统计；没有 UA 的请求同样不计入。
const botUserAgent =
  /bot|spider|crawler|slurp|facebookexternalhit|bingpreview|curl\/|wget\/|python-requests|go-http-client|headlesschrome/i;
// trustProxy 关闭时始终使用直连套接字地址；开启时取 X-Forwarded-For 最右侧一段，
// 即直连反代自己追加的那一跳，避免客户端伪造左侧字段。仅在确认所有外部流量
// 必须经过唯一受控反代、且该反代不可被绕过直连时才能开启。
function clientIp(req, trustProxy) {
  if (trustProxy) {
    const header = req.headers["x-forwarded-for"];
    if (typeof header === "string" && header.trim()) {
      const parts = header.split(",").map((part) => part.trim());
      const last = parts[parts.length - 1];
      if (last) return last;
    }
  }
  return req.socket.remoteAddress ?? "";
}
export async function createApp(options = {}) {
  const host = options.host ?? process.env.ADMIN_HOST ?? "127.0.0.1";
  const port = options.port ?? Number(process.env.ADMIN_PORT ?? 4322);
  const origin =
    options.origin ?? process.env.ADMIN_ORIGIN ?? `http://127.0.0.1:${port}`;
  const local = ["127.0.0.1", "::1"].includes(host);
  const dir = path.resolve(
    options.dir ?? process.env.ADMIN_DATA_DIR ?? path.join(root, ".inkbrain"),
  );
  // 数据目录落在仓库内时，git pull、重新 clone 或切换部署目录都会连带丢数据。
  // 本地开发用默认目录是有意为之，只在非回环监听（即对外提供服务）时警告。
  if (
    !local &&
    (dir === root || dir.startsWith(root + path.sep)) &&
    !options.dir
  )
    console.warn(
      `警告：数据目录 ${dir} 位于仓库内，代码更新可能导致内容丢失。请把 ADMIN_DATA_DIR 指向仓库之外的持久目录。`,
    );
  const web = options.web ?? path.join(root, "apps/web");
  const store = await createStore(dir, web);
  const auth = await createAuth({
    dir,
    origin,
    allowSetup: local,
    initialPassword: options.password ?? process.env.ADMIN_PASSWORD ?? "Ryan1010",
  });
  const publisher = await createPublisher({
    dir,
    web,
    root,
    siteUrl: process.env.SITE_URL ?? origin,
    buildOverride: options.buildOverride,
  });
  const trustProxy =
    options.trustProxy ?? process.env.ADMIN_TRUST_PROXY === "1";
  const stats = await createStats({ dir, now: options.now });
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    if (req.get("host") !== new URL(origin).host)
      return res.status(400).send("Host not allowed");
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
    if (req.path.startsWith("/admin"))
      res.set({
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data: blob:; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
      });
    next();
  });
  // 只统计游客可见的公开 HTML 页面：非 GET、明显爬虫或空 UA、后台与统计接口本身、
  // 以及非 200 或非 HTML 的响应（包括伪造文章地址触发的 404）一律不计入。
  app.use((req, res, next) => {
    const ua = req.get("user-agent") ?? "";
    if (
      req.method === "GET" &&
      !req.path.startsWith("/admin") &&
      !req.path.startsWith("/api/") &&
      ua &&
      !botUserAgent.test(ua)
    ) {
      const ip = clientIp(req, trustProxy);
      const requestPath = req.path;
      res.on("finish", () => {
        if (
          res.statusCode === 200 &&
          (res.get("content-type") ?? "").includes("text/html")
        )
          stats.recordVisit({ ip, ua, path: requestPath });
      });
    }
    next();
  });
  app.use("/admin/api", express.json({ limit: "2mb" }));
  app.get("/admin/api/session", (req, res) => {
    const s = auth.session(req);
    res.json({
      configured: auth.configured(),
      authenticated: !!s,
      csrf: s?.csrf,
    });
  });
  app.post("/admin/api/setup", auth.trusted, auth.setup);
  app.post("/admin/api/login", auth.trusted, auth.login);
  app.use("/admin/api", auth.requireAuth);
  app.use("/admin/api", (req, res, next) =>
    req.method === "GET" || req.method === "HEAD"
      ? next()
      : auth.trusted(req, res, () => auth.csrf(req, res, next)),
  );
  app.post("/admin/api/logout", auth.logout);
  app.get("/admin/api/state", async (req, res) => {
    const state = await store.read();
    res.json({
      state,
      catalogs: {
        ...catalogs,
        tags: state.tags.map(({ slug, label }) => [slug, label]),
      },
      active: publisher.current(),
      job: publisher.status(),
    });
  });
  app.put("/admin/api/records/:kind/:id", async (req, res) => {
    const { kind, id } = req.params;
    slug.parse(id);
    const record = parseRecord(kind, req.body.record, id);
    const state = await store.update(req.body.revision, (s) => {
      const index = s[kind].findIndex((x) => x.id === id);
      if (index < 0) s[kind].push(record);
      else s[kind][index] = record;
    });
    res.json({ state });
  });
  app.delete("/admin/api/records/:kind/:id", async (req, res) => {
    const { kind, id } = req.params;
    if (!kinds.includes(kind))
      return res.status(404).json({ error: "内容类型不存在" });
    slug.parse(id);
    if (publisher.status().status === "building")
      return res.status(409).json({ error: "站点正在更新，请完成后再删除。" });
    const state = await store.update(req.body.revision, (s) => {
      const index = s[kind].findIndex((x) => x.id === id);
      if (index < 0)
        throw Object.assign(new Error("内容不存在"), { status: 404 });
      s[kind].splice(index, 1);
      if (kind === "projects")
        for (const tool of s.tools)
          if (tool.data.relatedProject === id) tool.data.relatedProject = "";
      for (const topic of s.knowledge) {
        if (topic.data.items)
          topic.data.items = topic.data.items.filter(
            (item) => item.kind !== kind || item.id !== id,
          );
        if (topic.data.references?.[kind])
          topic.data.references[kind] = topic.data.references[kind].filter(
            (ref) => ref !== id,
          );
      }
    });
    const task = await publisher.start(state);
    await task.promise;
    if (publisher.status().status !== "succeeded")
      return res.status(502).json({
        error: `已从后台删除，但访客站点更新失败：${publisher.status().message}`,
        state,
      });
    res.json({ state, active: publisher.current() });
  });
  app.put("/admin/api/settings", async (req, res) => {
    const settings = settingsSchema.parse(req.body.settings);
    const state = await store.update(req.body.revision, (s) => {
      s.settings = settings;
    });
    res.json({ state });
  });
  app.put("/admin/api/tags", async (req, res) => {
    const tags = tagListSchema.parse(req.body.tags);
    const known = new Set(tags.map((tag) => tag.slug));
    const state = await store.update(req.body.revision, (s) => {
      for (const article of s.articles)
        for (const tag of article.data.tags)
          if (!known.has(tag))
            throw Object.assign(
              new Error(
                `标签「${tag}」仍被文章「${article.data.title}」使用，请先从文章中移除。`,
              ),
              { status: 409 },
            );
      s.tags = tags;
    });
    res.json({ state });
  });
  app.post("/admin/api/markdown", (req, res) => {
    if (typeof req.body.body !== "string" || req.body.body.length > 500000)
      return res.status(400).json({ error: "正文过长" });
    const html = cleanMarkdown(req.body.body).replace(
      /src="\/media\/([^"/]+)"/g,
      'src="/admin/api/assets/$1"',
    );
    res.json({ html });
  });
  app.get("/admin/api/export", async (req, res) => {
    res.attachment(
      `inkbrain-content-${new Date().toISOString().slice(0, 10)}.json`,
    );
    res.json({
      state: await store.read(),
      assets: await readJson(path.join(dir, "assets.json"), []),
    });
  });

  const uploadDir = path.join(dir, "uploads");
  const documentLimit = options.documentLimit ?? 2 * 1024 * 1024;
  const inspectLimit = options.inspectLimit ?? 64 * 1024 * 1024;
  await fs.mkdir(uploadDir, { recursive: true, mode: 0o700 });
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename(req, file, cb) {
        const ext = extensions.find((ext) =>
          file.originalname.toLowerCase().endsWith(ext),
        );
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: {
      fileSize: options.uploadLimit ?? 256 * 1024 * 1024,
      files: 1,
      fields: 0,
      parts: 2,
    },
    fileFilter(req, file, cb) {
      cb(
        extensions.some((ext) => file.originalname.toLowerCase().endsWith(ext))
          ? null
          : Object.assign(
              new Error(
                "支持 HTML、Markdown、PNG、JPEG、WebP、PDF、DMG、ZIP、tar.gz、VSIX 和 SKILL",
              ),
              { status: 400 },
            ),
        true,
      );
    },
  });
  let assetQueue = Promise.resolve();
  const findAsset = async (filename) =>
    (await readJson(path.join(dir, "assets.json"), [])).find(
      (asset) => asset.filename === filename,
    );
  const readDocument = async (asset) => {
    if (!asset || !asset.type.startsWith("text/"))
      throw Object.assign(new Error("该文件不是可渲染文档"), { status: 400 });
    if (asset.size > documentLimit)
      throw Object.assign(new Error("HTML 和 Markdown 文件最多 2 MB"), {
        status: 413,
      });
    const bytes = await fs.readFile(path.join(uploadDir, asset.filename));
    let source;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw Object.assign(new Error("文档必须是有效的 UTF-8 文本"), {
        status: 400,
      });
    }
    if (source.includes("\0"))
      throw Object.assign(new Error("文档不能包含二进制空字符"), {
        status: 400,
      });
    return asset.type === "text/markdown"
      ? source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
      : source;
  };
  app.get("/admin/api/assets", async (req, res) =>
    res.json(await readJson(path.join(dir, "assets.json"), [])),
  );
  app.post("/admin/api/assets", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "请选择文件" });
    const ext = path.extname(req.file.filename);
    const type = imageTypes[ext] ?? documentTypes[ext];
    if (imageTypes[ext]) {
      const handle = await fs.open(req.file.path, "r");
      const bytes = Buffer.alloc(12);
      await handle.read(bytes, 0, 12, 0);
      await handle.close();
      const valid =
        ext === ".png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : ext === ".webp"
            ? bytes.toString("ascii", 0, 4) === "RIFF" &&
              bytes.toString("ascii", 8, 12) === "WEBP"
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: "图片内容与文件格式不匹配" });
      }
    }
    if (documentTypes[ext]) {
      try {
        await readDocument({
          filename: req.file.filename,
          type: documentTypes[ext],
          size: req.file.size,
        });
      } catch (error) {
        await fs.unlink(req.file.path);
        throw error;
      }
    }
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(req.file.path))
      hash.update(chunk);
    const asset = {
      id: randomUUID(),
      filename: req.file.filename,
      name: Buffer.from(req.file.originalname, "latin1").toString("utf8"),
      url: `/media/${req.file.filename}`,
      size: req.file.size,
      sha256: hash.digest("hex"),
      type: type ?? "application/octet-stream",
      createdAt: new Date().toISOString(),
    };
    const save = assetQueue.then(async () => {
      const assets = await readJson(path.join(dir, "assets.json"), []);
      assets.unshift(asset);
      await atomicJson(path.join(dir, "assets.json"), assets);
    });
    assetQueue = save.catch(() => {});
    await save;
    res.status(201).json(asset);
  });
  app.delete("/admin/api/assets/:filename", async (req, res) => {
    const state = await store.read();
    const asset = await findAsset(req.params.filename);
    if (!asset) return res.status(404).json({ error: "文件不存在" });
    if (JSON.stringify(state).includes(asset.url))
      return res.status(409).json({
        error: `文件「${asset.name}」仍被草稿内容引用，请先移除引用。`,
      });
    const remove = assetQueue.then(async () => {
      const assets = await readJson(path.join(dir, "assets.json"), []);
      const index = assets.findIndex(
        (entry) => entry.filename === asset.filename,
      );
      if (index < 0)
        throw Object.assign(new Error("文件不存在"), { status: 404 });
      const nextAssets = assets.toSpliced(index, 1);
      await atomicJson(path.join(dir, "assets.json"), nextAssets);
      try {
        await fs.unlink(path.join(uploadDir, asset.filename));
      } catch (error) {
        await atomicJson(path.join(dir, "assets.json"), assets);
        throw error;
      }
      return nextAssets;
    });
    assetQueue = remove.catch(() => {});
    res.json({ assets: await remove });
  });
  app.get("/admin/api/assets/:filename/source", async (req, res) => {
    const asset = await findAsset(req.params.filename);
    if (!asset) return res.status(404).end();
    res.json({ source: await readDocument(asset), type: asset.type });
  });
  app.get("/admin/api/assets/:filename/preview", async (req, res) => {
    const asset = await findAsset(req.params.filename);
    if (!asset) return res.status(404).end();
    const source = await readDocument(asset);
    const html = cleanMarkdown(source).replace(
      /src="\/media\/([^"/]+)"/g,
      'src="/admin/api/assets/$1"',
    );
    res.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' https: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
    );
    res
      .type("html")
      .send(
        `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;padding:16px;color:#232a28;background:#fffefa;font:15px/1.75 system-ui,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}pre{overflow:auto;padding:12px;background:#eef1ed}code{font-family:ui-monospace,monospace}h1,h2,h3{line-height:1.3}</style><body>${html}</body></html>`,
      );
  });
  app.get("/admin/api/assets/:filename", async (req, res) => {
    const asset = await findAsset(req.params.filename);
    if (!asset) return res.status(404).end();
    res.type(asset.type);
    if (!asset.type.startsWith("image/")) res.attachment(asset.name);
    res.sendFile(path.join(uploadDir, asset.filename), { dotfiles: "allow" });
  });
  // 只在内存中读取压缩包里的 SKILL.md 与清单，不解包落盘、不执行其中内容。
  app.post("/admin/api/skill-inspect", async (req, res) => {
    const filename = String(req.body?.filename ?? "");
    if (!/^[a-f0-9-]+\.(?:zip|skill)$/.test(filename))
      return res.status(400).json({ error: "请先上传 ZIP 或 .skill 文件" });
    const asset = await findAsset(filename);
    if (!asset) return res.status(404).json({ error: "找不到该文件，请重新上传" });
    if (asset.size > inspectLimit)
      return res.status(413).json({
        error: `压缩包超过 ${inspectLimit / 1024 / 1024} MB，无法解析说明，仍可作为附件下载`,
      });
    res.json(inspectSkillPackage(await fs.readFile(path.join(uploadDir, filename))));
  });
  app.post("/admin/api/build", async (req, res) => {
    const state = await store.read();
    if (req.body.revision !== state.revision)
      return res.status(409).json({ error: "草稿版本已更新，请重新载入" });
    const task = await publisher.start(state);
    res.status(202).json(task.job);
  });
  app.get("/admin/api/build", (req, res) =>
    res.json({ job: publisher.status(), active: publisher.current() }),
  );
  // 公开只读统计接口，供访客页面读取；不需要鉴权，也不产生任何副作用。
  app.get("/api/stats/summary", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(stats.summary());
  });
  app.get("/api/stats/articles", (req, res) => {
    res.set("Cache-Control", "no-store");
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => slug.safeParse(id).success)
      .slice(0, 100);
    res.json(stats.articleVisitors(ids));
  });
  app.use(
    "/admin",
    express.static(path.join(here, "public"), {
      index: "index.html",
      dotfiles: "deny",
    }),
  );
  app.use("/admin", (req, res) => res.status(404).end());
  app.use((req, res, next) => {
    const active = publisher.current();
    if (!active)
      return res
        .status(503)
        .type("html")
        .send(
          '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>InkBrain</title><h1>网站尚未发布</h1><p>作者完成发布后，内容将在这里展示。</p><a href="/admin/">进入后台</a></html>',
        );
    if (
      req.path.startsWith("/media/") &&
      !/\.(png|jpe?g|webp)$/i.test(req.path)
    )
      res.attachment(path.basename(req.path));
    express.static(path.join(publisher.releaseRoot, active.id, "dist"), {
      dotfiles: "deny",
      etag: true,
      maxAge: 0,
      setHeaders(res, file) {
        if (file.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
      },
    })(req, res, next);
  });
  app.use((req, res) => res.status(404).send("页面不存在"));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status =
      err.status ??
      (err.name === "ZodError" || err instanceof multer.MulterError
        ? 400
        : 500);
    const error =
      err.name === "ZodError"
        ? err.issues.map(describeIssue).join("；")
        : err instanceof multer.MulterError
          ? "文件上传失败：请检查大小（最多 256 MB）和文件数量"
          : err.message;
    res.status(status).json({ error });
  });
  return { app, store, publisher, stats, dir, origin, host, port };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  // 只在作为可执行入口时读 .env；测试直接构造 app，不应受本机配置影响。
  // 已存在的环境变量优先，便于临时覆盖而不改文件。
  for (const file of [path.join(root, ".env.local"), path.join(root, ".env")])
    try {
      process.loadEnvFile(file);
    } catch {
      // 文件不存在时跳过。
    }
  const service = await createApp();
  const dataDir = service.dir;
  const server = service.app.listen(service.port, service.host, () =>
    console.log(
      `InkBrain 后台：${service.origin}/admin/\n发布站点：${service.origin}/\n数据目录：${dataDir}`,
    ),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () =>
      server.close(() => service.stats.close().then(() => process.exit(0))),
    );
}
