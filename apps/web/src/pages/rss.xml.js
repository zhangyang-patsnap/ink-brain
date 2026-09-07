import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: 'InkBrain 技术写作',
    description: 'AI 应用架构、后端工程与可验证技术路径。',
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.summary,
      pubDate: article.data.publishedAt,
      link: `/writing/${article.id}/`,
      customData: `<demo>${article.data.demo}</demo>`,
    })),
  });
}
