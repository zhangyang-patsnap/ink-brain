import assert from 'node:assert/strict';
import test from 'node:test';
import { topicSequence, topicPreview } from '../src/lib/topic-preview.mjs';

test('detail retains every valid reference in author order and agrees with homepage', () => {
  const catalog = new Map([
    ['tools:t', { type: '工具', title: '工具', summary: '', href: '/tools/t/' }],
    ['articles:a', { type: '文章', title: '文章', summary: '', href: '/writing/a/' }],
    ['projects:p', { type: '项目', title: '项目', summary: '', href: '/projects/p/' }],
  ]);
  const refs = [{kind:'tools',id:'t'},{kind:'articles',id:'draft'},{kind:'articles',id:'a'},{kind:'projects',id:'p'}];
  const sequence = topicSequence(refs, catalog);
  const preview = topicPreview(refs, catalog);
  assert.equal(sequence.total, 3);
  assert.deepEqual(sequence.items.map(item => item.type), ['工具','文章','项目']);
  assert.deepEqual(sequence.counts, preview.counts);
  assert.equal(sequence.total, preview.total);
  assert.deepEqual(preview.preview, sequence.items.slice(0,2));
});

test('missing references yield an empty sequence', () => {
  assert.deepEqual(topicSequence([{kind:'articles',id:'missing'}],new Map()), {total:0,counts:[],items:[]});
});
