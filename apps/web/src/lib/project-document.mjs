import sanitizeHtml from 'sanitize-html';
import { renderMarkdown } from './markdown.mjs';

export const projectStatusLabels = { concept: '构思', building: '研发中', released: '已发布', verified: '已验证' };

/** Only explicitly configured web addresses may become project actions. */
export function projectLinks(values, legacy) {
  const candidates = Array.isArray(values) && values.length ? values : [legacy];
  const seen = new Set();
  return candidates.flatMap(value => {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return [];
    try {
      const url = new URL(value.trim());
      if (url.username || url.password || seen.has(url.href)) return [];
      seen.add(url.href);
      return [url.href];
    } catch { return []; }
  });
}

/** Build the directory after sanitization; no client script is needed for anchors. */
export function projectDocument(source = '', { startLevel = 3 } = {}) {
  const safe = renderMarkdown(source);
  const headings = [...safe.matchAll(/<h([1-6])>([\s\S]*?)<\/h\1>/g)];
  const minimum = Math.min(...headings.map(match => Number(match[1])));
  const toc = [];
  let index = 0;
  const html = safe.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_, rawLevel, content) => {
    const depth = Number(rawLevel) - minimum;
    const id = `project-readme-section-${++index}`;
    const label = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
    if (depth < 2 && label.trim()) toc.push({ id, label, depth });
    const level = Math.min(6, depth + startLevel);
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
  return { html, toc };
}
