import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function renderMarkdown(source) {
  return sanitizeHtml(marked.parse(source), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2"],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
