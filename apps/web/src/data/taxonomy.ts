export const articleTagSlugs = [
  "agent-systems",
  "typed-contracts",
  "runtime-protocol",
  "observability",
  "rust",
  "failure-design",
] as const;

export type ArticleTagSlug = (typeof articleTagSlugs)[number];

export const articleTags: ReadonlyArray<{
  slug: ArticleTagSlug;
  label: string;
}> = [
  { slug: "agent-systems", label: "Agent Systems" },
  { slug: "typed-contracts", label: "Typed Contracts" },
  { slug: "runtime-protocol", label: "Runtime Protocol" },
  { slug: "observability", label: "Observability" },
  { slug: "rust", label: "Rust" },
  { slug: "failure-design", label: "Failure Design" },
];

export const getArticleTag = (slug: string) =>
  articleTags.find((tag) => tag.slug === slug);
