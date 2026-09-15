import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesTool, normalizeToolQuery, toolSearchText, toolCategories, showcaseTools } from '../src/lib/tool-search.mjs';

const tools = [
  { name: 'Trace Deck', kind: 'macos-app', summary: '运行事件', platform: 'macOS' },
  { name: 'Contract Kit', kind: 'cli', summary: '校验 JSON Schema', platform: 'macOS / Linux' },
  { name: 'Prompt Shelf', kind: 'plugin', summary: '提示词管理', platform: 'Editor' },
  { name: 'JSON Formatter', kind: 'web-tool', summary: '整理 JSON', platform: 'Browser' },
];
const filter = (category, query) => tools.filter(tool => matchesTool(tool.kind, toolSearchText(tool), category, query));

test('catalog categories exclude web tools', () => {
  assert.deepEqual(toolCategories.map(item => item.label), ['全部', '桌面应用', '命令行', '插件']);
});
test('homepage excludes web tools before rendering without mutating data', () => {
  assert.deepEqual(showcaseTools(tools), tools.slice(0, 3));
  assert.deepEqual(showcaseTools([tools[3]]), []);
  assert.deepEqual(showcaseTools([]), []);
  assert.equal(tools.length, 4);
  assert.deepEqual(filter('all', 'Browser'), []);
});
test('empty query preserves all tools and original order', () => {
  assert.deepEqual(filter('all', '  '), tools.slice(0, 3));
  assert.deepEqual(filter('cli', ''), [tools[1]]);
});
test('search normalizes width, case and whitespace and matches every term', () => {
  assert.equal(normalizeToolQuery(' ＪＳＯＮ　 Schema\n'), 'json schema');
  assert.deepEqual(filter('all', 'ＪＳＯＮ schema'), [tools[1]]);
  assert.deepEqual(filter('all', 'MACOS'), tools.slice(0, 2));
  assert.deepEqual(filter('all', '命令行'), [tools[1]]);
  assert.deepEqual(filter('all', '运行事件'), [tools[0]]);
});
test('category and query intersect without fallback or fuzzy matches', () => {
  assert.deepEqual(filter('web-tool', 'JSON'), []);
  assert.deepEqual(filter('cli', 'Browser'), []);
  assert.deepEqual(filter('all', '<script>'), []);
  assert.deepEqual(filter('all', 'missing'), []);
  assert.deepEqual(filter('all', 'json missing'), []);
});
