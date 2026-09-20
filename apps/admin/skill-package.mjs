import { inflateRawSync } from "node:zlib";
import YAML from "yaml";

// 压缩包只在内存中读取元数据文件，不解包落盘、不执行其中任何内容。
// 上限先按中央目录声明值校验，再在实际解压时按累计字节二次校验，
// 因为声明值完全由上传者控制。
export const limits = {
  maxEntries: 2000,
  maxEntryBytes: 4 * 1024 * 1024,
  maxTotalBytes: 16 * 1024 * 1024,
  maxRatio: 200,
};

const fail = (message) =>
  Object.assign(new Error(message), { status: 400, skillPackage: true });

const SIGNATURE_END = 0x06054b50;
const SIGNATURE_END_64 = 0x06064b50;
const SIGNATURE_CENTRAL = 0x02014b50;
const SIGNATURE_LOCAL = 0x04034b50;

// 从尾部向前找中央目录结束记录，跳过可能存在的注释。
function locateEndRecord(buffer) {
  const floor = Math.max(0, buffer.length - 0xffff - 22);
  for (let at = buffer.length - 22; at >= floor; at -= 1)
    if (buffer.readUInt32LE(at) === SIGNATURE_END) return at;
  throw fail("压缩包格式无法识别，请确认是标准 ZIP 文件");
}

function readDirectory(buffer) {
  const end = locateEndRecord(buffer);
  let count = buffer.readUInt16LE(end + 10);
  let start = buffer.readUInt32LE(end + 16);
  let size = buffer.readUInt32LE(end + 12);
  if (start === 0xffffffff || count === 0xffff || size === 0xffffffff) {
    // ZIP64：定位器紧接在结束记录之前。
    const locator = end - 20;
    if (locator < 0 || buffer.readUInt32LE(locator) !== 0x07064b50)
      throw fail("压缩包使用了不支持的 ZIP64 结构");
    const record = Number(buffer.readBigUInt64LE(locator + 8));
    if (
      record < 0 ||
      record + 56 > buffer.length ||
      buffer.readUInt32LE(record) !== SIGNATURE_END_64
    )
      throw fail("压缩包使用了不支持的 ZIP64 结构");
    count = Number(buffer.readBigUInt64LE(record + 32));
    size = Number(buffer.readBigUInt64LE(record + 40));
    start = Number(buffer.readBigUInt64LE(record + 48));
  }
  if (count > limits.maxEntries)
    throw fail(`压缩包条目过多，最多 ${limits.maxEntries} 个`);
  if (start < 0 || size < 0 || start + size > buffer.length)
    throw fail("压缩包中央目录越界");
  const entries = [];
  let at = start;
  for (let index = 0; index < count; index += 1) {
    if (at + 46 > buffer.length || buffer.readUInt32LE(at) !== SIGNATURE_CENTRAL)
      throw fail("压缩包中央目录已损坏");
    const flags = buffer.readUInt16LE(at + 8);
    const method = buffer.readUInt16LE(at + 10);
    const compressedSize = buffer.readUInt32LE(at + 20);
    const uncompressedSize = buffer.readUInt32LE(at + 24);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const externalAttributes = buffer.readUInt32LE(at + 38);
    const offset = buffer.readUInt32LE(at + 42);
    if (at + 46 + nameLength > buffer.length)
      throw fail("压缩包中央目录已损坏");
    // 条目名按 UTF-8 读取；未标记 UTF-8 的旧包同样按 UTF-8 尽力解释。
    const rawName = buffer
      .subarray(at + 46, at + 46 + nameLength)
      .toString("utf8");
    entries.push({
      rawName,
      flags,
      method,
      compressedSize,
      uncompressedSize,
      externalAttributes,
      offset,
    });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const MACOS_NOISE = (segments) =>
  segments[0] === "__MACOSX" ||
  segments.some((segment) => segment === ".DS_Store" || segment.startsWith("._"));

// 先按原始文本拒绝穿越与绝对路径，再做归一化。
// 顺序反过来会让 `a/../../b` 这类路径在检查前就被抹平。
function normalizePath(rawName) {
  if (!rawName || rawName !== rawName.trim()) return null;
  if (rawName.includes("\\")) return null;
  if (rawName.includes("\0")) return null;
  if (rawName.startsWith("/")) return null;
  if (/^[a-z]:/i.test(rawName)) return null;
  const segments = rawName.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === ".."))
    return null;
  if (MACOS_NOISE(segments)) return null;
  return segments.join("/");
}

const isSymlink = (entry) => ((entry.externalAttributes >>> 16) & 0xf000) === 0xa000;

function usableEntries(buffer) {
  const entries = readDirectory(buffer);
  const seen = new Set();
  const usable = [];
  let declaredTotal = 0;
  for (const entry of entries) {
    if (entry.rawName.endsWith("/")) continue; // 目录条目
    if (isSymlink(entry)) throw fail("压缩包含有符号链接，已拒绝解析");
    const path = normalizePath(entry.rawName);
    if (path === null) {
      if (MACOS_NOISE(entry.rawName.split("/"))) continue;
      throw fail(`压缩包条目路径不合法：${entry.rawName.slice(0, 120)}`);
    }
    if (entry.uncompressedSize > limits.maxEntryBytes)
      throw fail(
        `压缩包内「${path}」超过单文件 ${limits.maxEntryBytes / 1024 / 1024} MB 上限`,
      );
    if (
      entry.compressedSize > 0 &&
      entry.uncompressedSize / entry.compressedSize > limits.maxRatio
    )
      throw fail(`压缩包内「${path}」压缩比异常，已拒绝解析`);
    declaredTotal += entry.uncompressedSize;
    if (declaredTotal > limits.maxTotalBytes)
      throw fail(
        `压缩包解压后超过 ${limits.maxTotalBytes / 1024 / 1024} MB 上限`,
      );
    if (seen.has(path)) throw fail(`压缩包含有重复条目：${path}`);
    seen.add(path);
    usable.push({ ...entry, path });
  }
  return usable;
}

// 解压单个条目，按实际读出的字节再校验一次上限。
function readEntry(buffer, entry, budget) {
  if (entry.flags & 0x0001) throw fail("压缩包已加密，无法读取说明");
  if (entry.offset + 30 > buffer.length ||
      buffer.readUInt32LE(entry.offset) !== SIGNATURE_LOCAL)
    throw fail(`压缩包内「${entry.path}」的数据头已损坏`);
  const nameLength = buffer.readUInt16LE(entry.offset + 26);
  const extraLength = buffer.readUInt16LE(entry.offset + 28);
  const start = entry.offset + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;
  if (end > buffer.length) throw fail(`压缩包内「${entry.path}」的数据越界`);
  const raw = buffer.subarray(start, end);
  let bytes;
  if (entry.method === 0) bytes = Buffer.from(raw);
  else if (entry.method === 8)
    try {
      bytes = inflateRawSync(raw, { maxOutputLength: limits.maxEntryBytes });
    } catch {
      throw fail(`压缩包内「${entry.path}」无法解压或超过单文件上限`);
    }
  else throw fail(`压缩包内「${entry.path}」使用了不支持的压缩方式`);
  if (bytes.length > limits.maxEntryBytes)
    throw fail(
      `压缩包内「${entry.path}」超过单文件 ${limits.maxEntryBytes / 1024 / 1024} MB 上限`,
    );
  budget.total += bytes.length;
  if (budget.total > limits.maxTotalBytes)
    throw fail(`压缩包解压后超过 ${limits.maxTotalBytes / 1024 / 1024} MB 上限`);
  return bytes;
}

const decodeText = (bytes, path) => {
  const text = bytes.toString("utf8");
  if (text.includes("�")) throw fail(`压缩包内「${path}」不是 UTF-8 文本`);
  return text.replace(/^﻿/, "");
};

// 包装目录由 SKILL.md 的深度推断：位于深度 1 时其首段即包装目录。
function detectEntry(entries) {
  const matches = entries.filter((entry) => {
    const segments = entry.path.split("/");
    return segments.length <= 2 && segments[segments.length - 1] === "SKILL.md";
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => a.path.split("/").length - b.path.split("/").length);
  const entry = matches[0];
  const segments = entry.path.split("/");
  return { entry, root: segments.length === 2 ? segments[0] : "" };
}

const relative = (path, root) =>
  root ? (path === root || path.startsWith(`${root}/`) ? path.slice(root.length + 1) : null) : path;

// 锚定正则，不按 `---` 切分，避免 YAML 值内含 `---` 时错切。
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function parseSkillDocument(text) {
  const match = FRONT_MATTER.exec(text);
  if (!match) return { meta: {}, body: text.trim(), frontMatterError: "" };
  const body = text.slice(match[0].length).trim();
  let meta = {};
  let frontMatterError = "";
  try {
    const document = YAML.parseDocument(match[1]);
    // parseDocument 不抛异常，它把问题收集到 errors 里并尽力恢复。
    if (document.errors.length)
      return { meta: {}, body, frontMatterError: "frontmatter 解析失败，已忽略" };
    const parsed = document.toJS();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      meta = parsed;
      // YAML 把 `version: 1.0` 解析成数字 1，会丢掉尾部的 0。
      // 标量的原始字面量更贴近作者的意图，标量键一律取它。
      for (const key of Object.keys(parsed)) {
        const node = document.get(key, true);
        if (node && typeof node.source === "string" && typeof parsed[key] !== "object")
          meta[key] = node.source;
      }
    } else frontMatterError = "frontmatter 不是键值结构，已忽略";
  } catch {
    frontMatterError = "frontmatter 解析失败，已忽略";
  }
  return { meta, body, frontMatterError };
}

// YAML 会把 `version: 1.0` 解析成数字，按文本接受而不是丢弃。
const text = (value) =>
  typeof value === "string"
    ? value.trim()
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";
// schema 对 name/summary 限 240、version 限 100。包内的 description 常远超此长度，
// 在这里截断，让接口返回的结果始终可直接保存。
const clamp = (value, max) => {
  const trimmed = text(value);
  if (trimmed.length <= max) return { value: trimmed, clamped: false };
  // 优先在句子或分句边界断开，避免截在半句话中间。
  const window = trimmed.slice(0, max);
  const boundary = Math.max(
    ...["。", "；", ";", ". ", "！", "？", "\n"].map((mark) => window.lastIndexOf(mark)),
  );
  const cut = boundary >= max * 0.5 ? window.slice(0, boundary + 1).trim() : window.trim();
  return { value: cut, clamped: true };
};

function readManifest(buffer, entries, root, budget) {
  for (const name of ["skill.manifest.json", ".skill-meta.json"]) {
    const entry = entries.find((item) => relative(item.path, root) === name);
    if (!entry) continue;
    try {
      const parsed = JSON.parse(decodeText(readEntry(buffer, entry, budget), entry.path));
      const skill = parsed?.skill && typeof parsed.skill === "object" ? parsed.skill : {};
      return {
        name: text(parsed?.name) || text(skill.name),
        description: text(parsed?.description) || text(skill.description),
        version: text(parsed?.version) || text(skill.version),
        source: name,
      };
    } catch (error) {
      if (error?.skillPackage) throw error;
      // 清单损坏不影响 SKILL.md 的读取。
    }
  }
  return null;
}

/**
 * 读取压缩包内的 Skill 元数据。只解压 SKILL.md 与可选清单，其余条目仅读头部。
 * @param {Buffer} buffer 压缩包字节
 * @returns {{name:string,summary:string,version:string,documentation:string,entryPath:string,root:string,fileCount:number,totalBytes:number,notes:string[]}}
 */
export function inspectSkillPackage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22 || buffer.readUInt16LE(0) !== 0x4b50)
    throw fail("不是有效的 ZIP 文件");
  const entries = usableEntries(buffer);
  if (entries.length === 0) throw fail("压缩包内没有可读文件");
  const found = detectEntry(entries);
  if (!found)
    throw fail("压缩包内没有找到 SKILL.md，文件已保存但需要手工填写说明");
  const { entry, root } = found;
  const scoped = root
    ? entries.filter((item) => relative(item.path, root) !== null)
    : entries;
  const budget = { total: 0 };
  const document = parseSkillDocument(decodeText(readEntry(buffer, entry, budget), entry.path));
  const manifest = readManifest(buffer, scoped, root, budget);
  const notes = [];
  if (document.frontMatterError) notes.push(document.frontMatterError);
  if (root) notes.push(`已剥离包装目录 ${root}/`);
  if (entries.length !== scoped.length)
    notes.push(`忽略了包装目录外的 ${entries.length - scoped.length} 个文件`);
  if (!document.body) notes.push("SKILL.md 正文为空");
  const name = clamp(text(document.meta.name) || manifest?.name || "", 240);
  const summary = clamp(text(document.meta.description) || manifest?.description || "", 240);
  const version = clamp(text(document.meta.version) || manifest?.version || "", 100);
  if (name.clamped) notes.push("名称过长，已截断到 240 字");
  if (summary.clamped) notes.push("包内简介过长，已截断到 240 字，完整说明见详细说明");
  if (version.clamped) notes.push("版本号过长，已截断到 100 字");
  return {
    name: name.value,
    summary: summary.value,
    version: version.value,
    documentation: document.body,
    entryPath: relative(entry.path, root) ?? entry.path,
    root,
    fileCount: scoped.length,
    totalBytes: scoped.reduce((sum, item) => sum + item.uncompressedSize, 0),
    manifestSource: manifest?.source ?? "",
    notes,
  };
}
