import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { articleTagSlugs } from "./data/taxonomy";
import { topicItems } from "./lib/topic-items.mjs";

const knownArticleTags = new Set<string>(articleTagSlugs);

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    tags: z
      .array(
        z.string().refine((tag) => knownArticleTags.has(tag), "未知文章标签"),
      )
      .default([]),
    readingMinutes: z.number().int().positive(),
    draft: z.boolean().default(false),
  }),
});

const knowledge = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/knowledge" }),
  schema: z.preprocess(
    (data) => ({ ...(data as object), items: topicItems(data) }),
    z.object({
      title: z.string(),
      summary: z.string(),
      order: z.number().int().nonnegative().default(0),
      items: z.array(
        z.object({
          kind: z.enum(["articles", "projects", "tools"]),
          id: z.string(),
        }),
      ),
    }),
  ),
});

export const collections = { articles, knowledge };
