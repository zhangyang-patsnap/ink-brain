/** @typedef {{type: string, title: string, summary: string, href: string}} TopicContent */

/**
 * Resolve only visitor-visible content while keeping the author's sequence.
 * @param {{kind: string, id: string}[]} references
 * @param {Map<string, TopicContent>} catalog
 */
export function topicSequence(references, catalog) {
  const items = references.flatMap(ref => {
    const item = catalog.get(`${ref.kind}:${ref.id}`);
    return item ? [item] : [];
  });
  const counts = ['文章', '项目', '工具'].map(type => ({
    type, count: items.filter(item => item.type === type).length,
  })).filter(({ count }) => count > 0);
  return { total: items.length, counts, items };
}

/** @param {{kind: string, id: string}[]} references @param {Map<string, TopicContent>} catalog */
export function topicPreview(references, catalog) {
  const { total, counts, items } = topicSequence(references, catalog);
  return { total, counts, preview: items.slice(0, 2) };
}
