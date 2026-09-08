import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import YAML from "yaml";
import {
  atomicJson,
  readJson,
  publishedRecords,
  validatePublication,
} from "./store.mjs";
import { cleanMarkdown } from "./schema.mjs";

export async function createPublisher({
  dir,
  web,
  root,
  siteUrl,
  buildOverride,
}) {
  let active = await readJson(path.join(dir, "active.json"), null);
  let job = { status: "idle" };
  let running = false;
  const releaseRoot = path.join(dir, "releases");
  await fs.mkdir(releaseRoot, { recursive: true });
  async function build(state) {
    const id = randomUUID();
    const stage = path.join(releaseRoot, id);
    job = {
      id,
      status: "building",
      revision: state.revision,
      startedAt: new Date().toISOString(),
      log: "",
    };
    try {
      validatePublication(state);
      await fs.mkdir(stage, { recursive: true });
      for (const item of [
        "src",
        "public",
        "astro.config.mjs",
        "tsconfig.json",
        "package.json",
      ])
        await fs.cp(path.join(web, item), path.join(stage, item), {
          recursive: true,
        });
      await fs.symlink(
        path.join(root, "node_modules"),
        path.join(stage, "node_modules"),
        "dir",
      );
      for (const kind of ["articles", "knowledge"]) {
        // Only replace generated copies inside this new build snapshot.
        const destination = path.join(stage, "src/content", kind);
        for (const file of await fs.readdir(destination))
          if (file.endsWith(".md") || file.endsWith(".mdx"))
            await fs.unlink(path.join(destination, file));
        for (const record of publishedRecords(state, kind)) {
          const data = { ...record.data };
          if (kind === "articles") data.draft = false;
          await fs.writeFile(
            path.join(destination, `${record.id}.md`),
            `---\n${YAML.stringify(data)}---\n\n${cleanMarkdown(record.body)}\n`,
          );
        }
      }
      for (const kind of ["projects", "tools"])
        await atomicJson(
          path.join(stage, `src/data/${kind}.json`),
          publishedRecords(state, kind).map((x) => x.data),
        );
      const tagSlugs = state.tags.map((tag) => tag.slug);
      await fs.writeFile(
        path.join(stage, "src/data/taxonomy.ts"),
        `export const articleTagSlugs = ${JSON.stringify(tagSlugs, null, 2)} as const;\n\nexport type ArticleTagSlug = (typeof articleTagSlugs)[number];\n\nexport const articleTags: ReadonlyArray<{ slug: ArticleTagSlug; label: string }> = ${JSON.stringify(state.tags, null, 2)};\n\nexport const getArticleTag = (slug: string) =>\n  articleTags.find((tag) => tag.slug === slug);\n`,
      );
      await atomicJson(
        path.join(stage, "src/data/settings.json"),
        state.settings,
      );
      const manifest = await readJson(path.join(dir, "assets.json"), []);
      for (const tool of publishedRecords(state, "tools")) {
        if (
          tool.data.availability === "available" &&
          tool.data.release.downloadUrl?.startsWith("/media/")
        ) {
          const asset = manifest.find(
            (a) => a.url === tool.data.release.downloadUrl,
          );
          if (
            !asset ||
            asset.sha256 !== tool.data.release.checksum.toLowerCase()
          )
            throw new Error(
              `工具「${tool.data.name}」的安装包与 SHA-256 不匹配`,
            );
        }
      }
      const selected = JSON.stringify({
        articles: publishedRecords(state, "articles"),
        knowledge: publishedRecords(state, "knowledge"),
        projects: publishedRecords(state, "projects"),
        tools: publishedRecords(state, "tools"),
        settings: state.settings,
      });
      const refs = new Set(
        [...selected.matchAll(/\/media\/([a-f0-9-]+\.[a-z0-9.]+)/g)].map(
          (x) => x[1],
        ),
      );
      await fs.mkdir(path.join(stage, "public/media"), { recursive: true });
      for (const filename of refs) {
        if (!manifest.some((x) => x.filename === filename))
          throw new Error(`引用的文件不存在：${filename}`);
        await fs.copyFile(
          path.join(dir, "uploads", filename),
          path.join(stage, "public/media", filename),
        );
      }
      await atomicJson(path.join(stage, "content.json"), state);
      if (buildOverride) await buildOverride(stage);
      else
        await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [path.join(root, "node_modules/astro/bin/astro.mjs"), "build"],
            {
              cwd: stage,
              env: { ...process.env, SITE_URL: siteUrl },
              stdio: ["ignore", "pipe", "pipe"],
            },
          );
          const timer = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error("构建超时，上一版本保持不变"));
          }, 120000);
          for (const stream of [child.stdout, child.stderr])
            stream.on("data", (chunk) => {
              job.log = (job.log + chunk.toString()).slice(-12000);
            });
          child.on("error", (e) => {
            clearTimeout(timer);
            reject(e);
          });
          child.on("exit", (code) => {
            clearTimeout(timer);
            code === 0
              ? resolve()
              : reject(new Error("站点构建失败，请检查内容或构建日志。"));
          });
        });
      const record = {
        id,
        revision: state.revision,
        createdAt: new Date().toISOString(),
      };
      await atomicJson(path.join(stage, "release.json"), record);
      await atomicJson(path.join(dir, "active.json"), record);
      active = record;
      job = {
        ...job,
        status: "succeeded",
        finishedAt: new Date().toISOString(),
        message: "发布成功",
      };
    } catch (e) {
      job = {
        ...job,
        status: "failed",
        message: e.message,
        finishedAt: new Date().toISOString(),
      };
    } finally {
      running = false;
    }
  }
  return {
    current: () => active,
    status: () => job,
    releaseRoot,
    async start(state) {
      if (running)
        throw Object.assign(new Error("已有构建正在进行，请稍后再试"), {
          status: 409,
        });
      running = true;
      const promise = build(structuredClone(state));
      return {
        promise,
        get job() {
          return job;
        },
      };
    },
  };
}
