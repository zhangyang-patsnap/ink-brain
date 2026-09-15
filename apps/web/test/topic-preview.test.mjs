import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topicPreview } from '../src/lib/topic-preview.mjs';

const catalog = new Map([
  ['articles:a', {type:'文章',title:'Article',summary:'Read',href:'/writing/a/'}],
  ['projects:p', {type:'项目',title:'Project',summary:'Practice',href:'/projects/p/'}],
  ['tools:t', {type:'工具',title:'Tool',summary:'Use',href:'/tools/t/'}],
]);
test('counts all mixed content and previews first two in configured order', () => {
  const refs = [{kind:'tools',id:'t'},{kind:'articles',id:'a'},{kind:'projects',id:'p'}];
  const result = topicPreview(refs,catalog);
  assert.equal(result.total,3);
  assert.deepEqual(result.counts,[{type:'文章',count:1},{type:'项目',count:1},{type:'工具',count:1}]);
  assert.deepEqual(result.preview.map(item=>item.href),['/tools/t/','/writing/a/']);
  assert.equal(refs.length,3);
});
test('missing or unpublished references never inflate totals or create links', () => {
  const result = topicPreview([{kind:'articles',id:'draft'},{kind:'projects',id:'p'},{kind:'tools',id:'missing'}],catalog);
  assert.equal(result.total,1);
  assert.deepEqual(result.counts,[{type:'项目',count:1}]);
  assert.equal(result.preview[0].href,'/projects/p/');
});
test('empty topic returns honest empty projection', () => {
  assert.deepEqual(topicPreview([],catalog),{total:0,counts:[],preview:[]});
});
