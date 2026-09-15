import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesArticle, normalizeSearch } from '../src/lib/article-search.mjs';

test('normalizes case, full-width letters and whitespace', () => {
  assert.equal(normalizeSearch('  ＡＩ\n  Runtime  '), 'ai runtime');
});
test('matches Chinese titles, summaries and multiple words in any order', () => {
  const text = 'Rust Agent Runtime 的边界设计 用类型、事件和所有权描述运行时。';
  for (const query of ['边界', '所有权', 'ＲＵＳＴ', ' runtime   Rust ', '事件 类型']) assert(matchesArticle(text, query));
  assert(!matchesArticle(text, 'Rust 缺失'));
});
test('blank query matches all, markup and regex characters are literal', () => {
  assert(matchesArticle('文章', ' \n '));
  assert(!matchesArticle('文章', '<script>alert(1)</script>'));
  assert(!matchesArticle('文章', '.*'));
  assert(matchesArticle('如何使用 C++ 与 [tool]', 'C++ [tool]'));
});
