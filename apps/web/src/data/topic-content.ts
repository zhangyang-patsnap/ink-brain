import { getCollection } from "astro:content";
import { ownedProjects } from "./projects";
import { softwareTools } from "./tools";

export async function topicCatalog() {
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  return new Map<
    string,
    { type: string; title: string; summary: string; href: string }
  >([
    ...articles.map(
      (article) =>
        [
          `articles:${article.id}`,
          {
            type: "文章",
            title: article.data.title,
            summary: article.data.summary,
            href: `/writing/${article.id}/`,
          },
        ] as const,
    ),
    ...ownedProjects.map(
      (project) =>
        [
          `projects:${project.slug}`,
          {
            type: "项目",
            title: project.name,
            summary: project.summary,
            href: `/projects/${project.slug}/`,
          },
        ] as const,
    ),
    ...softwareTools.map(
      (tool) =>
        [
          `tools:${tool.slug}`,
          {
            type: "工具",
            title: tool.name,
            summary: tool.summary,
            href: `/tools/${tool.slug}/`,
          },
        ] as const,
    ),
  ]);
}
