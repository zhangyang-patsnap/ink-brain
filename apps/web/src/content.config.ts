import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const maturity = z.enum(['idea', 'studied', 'implemented', 'verified', 'production']);

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    topic: z.string(),
    maturity,
    related: z.array(z.string()).default([]),
    readingMinutes: z.number().int().positive(),
    demo: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().int().nonnegative(),
    topic: z.string(),
    maturity,
    related: z.array(z.string()).default([]),
    demo: z.boolean().default(true),
  }),
});

export const collections = { articles, knowledge };
