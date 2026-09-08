import { z } from "zod";
import { topicItems } from "../web/src/lib/topic-items.mjs";
import { renderMarkdown } from "../web/src/lib/markdown.mjs";

export const kinds = ["articles", "knowledge", "projects", "tools"];
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);
const text = z.string().max(20000);
const title = z.string().trim().min(1).max(240);
const list = z.array(z.string().min(1).max(2000)).max(100);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v),
    "日期无效",
  );
export const safeUrl = z
  .string()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    if (/^\/(?!\/)[a-zA-Z0-9/_#.%-]+$/.test(v) && !v.startsWith("/admin"))
      return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "仅支持站内路径或 HTTPS 地址");
export const catalogs = {
  tags: [
    ["agent-systems", "Agent Systems"],
    ["typed-contracts", "Typed Contracts"],
    ["runtime-protocol", "Runtime Protocol"],
    ["observability", "Observability"],
    ["rust", "Rust"],
    ["failure-design", "Failure Design"],
  ],
  maturity: [
    ["idea", "构思"],
    ["studied", "已学习"],
    ["implemented", "已实现"],
    ["verified", "已验证"],
    ["production", "生产证据"],
  ],
};
export const tagListSchema = z
  .array(z.object({ slug, label: title }))
  .max(100)
  .superRefine((tags, ctx) => {
    const seen = new Set();
    for (const [index, tag] of tags.entries()) {
      if (seen.has(tag.slug))
        ctx.addIssue({
          code: "custom",
          message: "标签标识不能重复",
          path: [index, "slug"],
        });
      seen.add(tag.slug);
    }
  });
const maturity = z.enum(catalogs.maturity.map((x) => x[0]));
const common = {
  title,
  summary: title,
};
export const dataSchemas = {
  articles: z.object({
    ...common,
    publishedAt: date,
    tags: z.array(slug).max(30),
    readingMinutes: z.number().int().min(1).max(600),
    draft: z.boolean().default(false),
  }),
  knowledge: z.preprocess(
    (data) => ({ ...data, items: topicItems(data) }),
    z.object({
      ...common,
      order: z.number().int().min(0).default(0),
      items: z
        .array(
          z.object({
            kind: z.enum(["articles", "projects", "tools"]),
            id: slug,
          }),
        )
        .max(200)
        .refine(
          (items) =>
            new Set(items.map((item) => item.kind + ":" + item.id)).size ===
            items.length,
          "专题不能重复添加同一内容",
        ),
    }),
  ),
  projects: z.object({
    slug,
    name: title,
    type: z.enum(["Agent Framework", "Application", "Library", "Other"]),
    status: z.enum(["concept", "building", "released", "verified"]),
    demo: z.boolean(),
    tagline: title,
    summary: text,
    stack: list,
    capabilities: list,
    evidence: list,
    documentation: text,
    repositoryUrl: safeUrl.optional(),
    documentationUrl: safeUrl.optional(),
    repositoryUrls: z.array(safeUrl).optional(),
    documentationUrls: z.array(safeUrl).optional(),
    projectUrl: safeUrl
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        "项目访问地址须以 http:// 或 https:// 开头",
      )
      .optional(),
    related: z.array(
      z.object({
        label: title,
        href: safeUrl,
        domain: z.enum(["Writing", "Knowledge", "Lab", "Tool"]),
      }),
    ),
  }),
  tools: z
    .object({
      slug,
      name: title,
      monogram: z.string().min(1).max(5),
      kind: z.enum(["macos-app", "cli", "plugin", "web-tool"]),
      platform: title,
      availability: z.enum(["demo", "available", "retired"]),
      summary: title,
      description: text,
      features: list,
      screenshots: z
        .array(z.object({ src: safeUrl, alt: title }))
        .max(12)
        .optional(),
      relatedProject: slug.or(z.literal("")).optional(),
      release: z.object({
        version: title,
        packageFormat: title,
        fileSize: title,
        requirements: title,
        releasedAt: date,
        checksum: text,
        notes: list,
        downloadUrl: safeUrl.optional(),
      }),
    })
    .superRefine((v, ctx) => {
      if (
        v.availability === "available" &&
        (!v.release.downloadUrl || !/^[a-f0-9]{64}$/i.test(v.release.checksum))
      )
        ctx.addIssue({
          code: "custom",
          message: "开放下载需要安装包地址和有效 SHA-256",
          path: ["release", "downloadUrl"],
        });
    }),
};
export const settingsSchema = z.object({
  name: title,
  title,
  description: title,
  author: title,
  tagline: title,
  intro: text,
  bio: text,
});
export function parseRecord(kind, value, id) {
  if (!kinds.includes(kind)) throw new Error("未知内容类型");
  const result = z
    .object({
      id: slug,
      data: dataSchemas[kind],
      body: z.string().max(500000).default(""),
      included: z.boolean(),
      archived: z.boolean().default(false),
    })
    .parse(value);
  if (result.id !== id || (result.data.slug && result.data.slug !== id))
    throw new Error("内容标识不可更改");
  return result;
}
export const cleanMarkdown = renderMarkdown;
