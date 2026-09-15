export const toolCategories = [
  { value: 'all', label: '全部' },
  { value: 'macos-app', label: '桌面应用' },
  { value: 'cli', label: '命令行' },
  { value: 'plugin', label: '插件' },
];

// Homepage visibility only; retain the underlying records and detail routes.
export function showcaseTools(tools) {
  return tools.filter(tool => tool.kind !== 'web-tool');
}

export function normalizeToolQuery(value = '') {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

/** Only public catalog fields are searched; no requests or input persistence. */
export function toolSearchText(tool) {
  const category = toolCategories.find(item => item.value === tool.kind)?.label ?? '';
  return normalizeToolQuery([tool.name, tool.summary, tool.platform, tool.kind, category].join(' '));
}

export function matchesTool(kind, text, category = 'all', query = '') {
  if (kind === 'web-tool') return false;
  if (category !== 'all' && kind !== category) return false;
  const haystack = normalizeToolQuery(text);
  return normalizeToolQuery(query).split(' ').every(term => haystack.includes(term));
}
