/** @param {string} value */
export function normalizeSearch(value) {
  return value.normalize('NFKC').toLowerCase().trim().replace(/\s+/gu, ' ');
}

/** @param {string} text @param {string} query */
export function matchesArticle(text, query) {
  const normalizedText = normalizeSearch(text);
  return normalizeSearch(query).split(' ').filter(Boolean).every(term => normalizedText.includes(term));
}
