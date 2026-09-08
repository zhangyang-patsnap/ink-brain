import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import YAML from "yaml";
import { topicItems } from "../web/src/lib/topic-items.mjs";
import {
  catalogs,
  kinds,
  parseRecord,
  settingsSchema,
  tagListSchema,
} from "./schema.mjs";

export async function atomicJson(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
  await fs.rename(tmp, file);
}
export async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
}
export async function seedContent(web) {
  const state = { revision: 0, updatedAt: new Date().toISOString() };
  state.tags = catalogs.tags.map(([slug, label]) => ({ slug, label }));
  for (const kind of ["articles", "knowledge"]) {
    state[kind] = [];
    for (const file of (
      await fs.readdir(path.join(web, "src/content", kind))
    ).filter((f) => f.endsWith(".md"))) {
      const raw = await fs.readFile(
        path.join(web, "src/content", kind, file),
        "utf8",
      );
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error(`Frontmatter 无效: ${file}`);
      const data = YAML.parse(match[1]);
      const record = {
        id: file.slice(0, -3),
        data,
        body: match[2],
        included: !data.draft,
        archived: false,
      };
      state[kind].push(parseRecord(kind, record, record.id));
    }
  }
  for (const kind of ["projects", "tools"])
    state[kind] = (
      await readJson(path.join(web, `src/data/${kind}.json`), [])
    ).map((data) =>
      parseRecord(
        kind,
        { id: data.slug, data, body: "", included: true, archived: false },
        data.slug,
      ),
    );
  state.settings = settingsSchema.parse(
    await readJson(path.join(web, "src/data/settings.json")),
  );
  return state;
}
export async function createStore(dir, web) {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "draft.json");
  const existing = await readJson(file, null);
  if (!existing) {
    await atomicJson(file, await seedContent(web));
  } else if (!existing.tags) {
    existing.tags = catalogs.tags.map(([slug, label]) => ({ slug, label }));
    await atomicJson(file, existing);
  }
  let chain = Promise.resolve();
  return {
    read: async () => {
      const state = await readJson(file);
      for (const topic of state.knowledge)
        topic.data = parseRecord("knowledge", topic, topic.id).data;
      return state;
    },
    update(revision, mutate) {
      const run = chain.then(async () => {
        const state = await readJson(file);
        if (state.revision !== revision)
          throw Object.assign(
            new Error("内容已在其他窗口更新，请重新载入后再保存。"),
            { status: 409 },
          );
        const old = structuredClone(state);
        await mutate(state);
        state.revision++;
        state.updatedAt = new Date().toISOString();
        await atomicJson(
          path.join(dir, "history", `${old.revision}.json`),
          old,
        );
        await atomicJson(file, state);
        return state;
      });
      chain = run.catch(() => {});
      return run;
    },
  };
}
export function publishedRecords(state, kind) {
  const records = state[kind].filter(
    (record) => !record.archived && (kind === "articles" || record.included),
  );
  if (kind !== "knowledge") return records;
  return records.map((record) => ({
    ...record,
    data: {
      ...parseRecord("knowledge", record, record.id).data,
      items: topicItems(record.data).filter((item) =>
        state[item.kind]?.some(
          (target) =>
            target.id === item.id &&
            !target.archived &&
            (item.kind === "articles" || target.included),
        ),
      ),
    },
  }));
}
export function validatePublication(state) {
  settingsSchema.parse(state.settings);
  const tags = tagListSchema.parse(state.tags);
  const knownTags = new Set(tags.map((tag) => tag.slug));
  for (const kind of kinds)
    for (const record of state[kind]) {
      parseRecord(kind, record, record.id);
      if (kind === "articles")
        for (const tag of record.data.tags)
          if (!knownTags.has(tag))
            throw new Error(
              `文章「${record.data.title}」使用了不存在的标签：${tag}`,
            );
    }
  const known = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      new Set(publishedRecords(state, kind).map((x) => x.id)),
    ]),
  );
  for (const tool of publishedRecords(state, "tools"))
    if (
      tool.data.relatedProject &&
      !known.projects.has(tool.data.relatedProject)
    )
      throw new Error(`工具「${tool.data.name}」关联项目未发布`);
}
