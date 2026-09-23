import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { atomicJson, readJson } from "./store.mjs";

// 匹配单篇文章详情页路径，标识规则与 schema.mjs 的 slug 保持一致。
const articlePath = /^\/writing\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/;
const FLUSH_INTERVAL_MS = 15000;

function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

// 按 IP + User-Agent 哈希，按天去重独立访客；盐值每天更换且从不落盘，
// 磁盘上只保留聚合后的计数，不保留任何可关联到具体访客的数据。
// 进程重启会清空当天已计过的去重记录，同一访客当天可能被重新计入一次——
// 对个人技术博客的量级可接受，换来的是从不持久化访客可关联数据。
export async function createStats({ dir, now = () => new Date() }) {
  const file = path.join(dir, "stats.json");
  const persisted = await readJson(file, { totalVisitors: 0, articles: {} });
  const state = {
    totalVisitors: persisted.totalVisitors ?? 0,
    articles: { ...(persisted.articles ?? {}) },
  };
  let day = utcDay(now());
  let salt = randomBytes(16).toString("hex");
  let seenSite = new Set();
  let seenArticles = new Map();
  let dirty = false;
  let chain = Promise.resolve();

  function rollDayIfNeeded() {
    const current = utcDay(now());
    if (current === day) return;
    day = current;
    salt = randomBytes(16).toString("hex");
    seenSite = new Set();
    seenArticles = new Map();
  }
  function hash(ip, ua) {
    return createHash("sha256").update(`${salt}|${ip}|${ua}`).digest("hex");
  }
  function flush() {
    if (!dirty) return chain;
    dirty = false;
    const snapshot = {
      totalVisitors: state.totalVisitors,
      articles: state.articles,
      updatedAt: new Date().toISOString(),
    };
    chain = chain.then(() => atomicJson(file, snapshot)).catch(() => {});
    return chain;
  }
  const timer = setInterval(flush, FLUSH_INTERVAL_MS);
  timer.unref?.();

  return {
    recordVisit({ ip, ua, path: requestPath }) {
      rollDayIfNeeded();
      const key = hash(ip ?? "", ua ?? "");
      if (!seenSite.has(key)) {
        seenSite.add(key);
        state.totalVisitors++;
        dirty = true;
      }
      const match = articlePath.exec(requestPath ?? "");
      if (match) {
        const id = match[1];
        let seen = seenArticles.get(id);
        if (!seen) {
          seen = new Set();
          seenArticles.set(id, seen);
        }
        if (!seen.has(key)) {
          seen.add(key);
          state.articles[id] = (state.articles[id] ?? 0) + 1;
          dirty = true;
        }
      }
    },
    summary() {
      return { totalVisitors: state.totalVisitors };
    },
    articleVisitors(ids) {
      const result = {};
      for (const id of ids) result[id] = state.articles[id] ?? 0;
      return result;
    },
    flush,
    async close() {
      clearInterval(timer);
      await flush();
    },
  };
}
