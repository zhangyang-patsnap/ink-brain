import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createApp } from '../server.mjs';
import { createGuestbook } from '../guestbook.mjs';

async function setup(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inkbrain-guestbook-'));
  const server = http.createServer();
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const service = await createApp({ dir, origin, password: 'test-password-123' });
  server.on('request', service.app);
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await service.stats.close(); await fs.rm(dir, { recursive: true, force: true }); });
  const req = (url, method = 'GET', body, headers = {}) => fetch(origin + url, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const login = await req('/admin/api/login', 'POST', { password: 'test-password-123' });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const { csrf } = await login.json();
  return { dir, req, auth: { Cookie: cookie, 'X-CSRF-Token': csrf } };
}

test('guestbook moderation, private fields, authorization and durable storage', async t => {
  const { dir, req, auth } = await setup(t);
  const payload = { nickname: '<b>访客</b>', body: '<script>alert(1)</script> 测试' };
  assert.equal((await req('/api/guestbook', 'POST', payload)).status, 201);
  const publicRead = await (await req('/api/guestbook?status=pending')).json();
  assert.deepEqual(publicRead.items, []);
  assert.equal((await req('/admin/api/guestbook')).status, 401);
  const pending = await (await req('/admin/api/guestbook', 'GET', undefined, auth)).json();
  const id = pending.items[0].id;
  assert.equal(pending.items[0].status, 'pending');
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'approved' })).status, 401);
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'approved' }, { Cookie: auth.Cookie })).status, 403);
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'approved' }, { ...auth, Origin: 'https://evil.example' })).status, 403);
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'approved' }, auth)).status, 200);
  const approved = await (await req('/api/guestbook')).json();
  assert.equal(approved.items[0].body, payload.body);
  assert.deepEqual(Object.keys(approved.items[0]).sort(), ['body','createdAt','id','nickname','repliedAt','reply']);
  assert.equal(createGuestbook(dir).list().items.length, 1);
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'pending' }, auth)).status, 200);
  assert.equal((await (await req('/api/guestbook')).json()).items.length, 0);
  assert.equal((await req(`/admin/api/guestbook/${id}`, 'PATCH', { status: 'rejected' }, auth)).status, 200);
  assert.equal((await (await req('/api/guestbook?status=rejected')).json()).items.length, 0);
  assert.equal((await req('/admin/api/guestbook/9999', 'PATCH', { status: 'approved' }, auth)).status, 404);
});

test('submission validates input, origin, size and rate; forwarding header does not bypass limits', async t => {
  const { req } = await setup(t);
  const valid = { nickname: '访客', body: '你好' };
  assert.equal((await req('/api/guestbook', 'POST', valid, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await req('/api/guestbook', 'POST', { ...valid, status: 'approved' })).status, 400);
  assert.equal((await req('/api/guestbook', 'POST', { ...valid, body: ' ' })).status, 400);
  assert.equal((await req('/api/guestbook', 'POST', { ...valid, body: 'x'.repeat(9000) })).status, 413);
  assert.equal((await req('/api/guestbook', 'POST', valid)).status, 201);
  assert.equal((await req('/api/guestbook', 'POST', valid)).status, 201);
  const limited = await req('/api/guestbook', 'POST', valid, { 'X-Forwarded-For': '1.2.3.4' });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});

test('cursor pagination has no duplicate entries and storage keeps all submissions', async t => {
  const { dir, req } = await setup(t);
  const store = createGuestbook(dir);
  for (let i = 0; i < 25; i++) store.submit({ nickname: `访客${i}`, body: '分页测试' });
  const pending = store.list({ status: 'pending', privateFields: true });
  const tail = store.list({ status: 'pending', before: pending.nextCursor, privateFields: true });
  assert.equal(pending.items.length, 20); assert.equal(tail.items.length, 5);
  for (const row of [...pending.items, ...tail.items]) store.moderate(row.id, { status: 'approved' });
  const first = await (await req('/api/guestbook')).json();
  const second = await (await req(`/api/guestbook?before=${first.nextCursor}`)).json();
  assert.equal(new Set([...first.items, ...second.items].map(m => m.id)).size, 25);
  assert.equal(second.nextCursor, null);
  assert.equal((await req('/api/guestbook?before=invalid')).status, 400);
});

test('private messages remain private after approval and visibility cannot be changed by moderation', async t => {
  const { req, auth, dir } = await setup(t);
  const response = await req('/api/guestbook', 'POST', { nickname: '私密访客', body: '不要公开', visibility: 'private' });
  assert.equal(response.status, 201);
  assert.match((await response.json()).message, /不会公开/);
  const pending = await (await req('/admin/api/guestbook', 'GET', undefined, auth)).json();
  const message = pending.items[0];
  assert.equal(message.visibility, 'private');
  assert.equal((await req(`/admin/api/guestbook/${message.id}`, 'PATCH', { status: 'approved', visibility: 'public' }, auth)).status, 400);
  assert.equal((await req(`/admin/api/guestbook/${message.id}`, 'PATCH', { status: 'approved' }, auth)).status, 200);
  assert.deepEqual((await (await req('/api/guestbook?visibility=private&privateFields=true')).json()).items, []);
  const store = createGuestbook(dir);
  assert.equal(store.list({ status: 'approved', privateFields: true }).items[0].visibility, 'private');
  assert.deepEqual(store.list().items, []);
  assert.equal((await req('/api/guestbook', 'POST', { nickname: '访客', body: '你好', visibility: 'invalid' })).status, 400);
});

test('old databases preserve public visibility and migration is repeatable', async t => {
  const { DatabaseSync } = await import('node:sqlite');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inkbrain-guestbook-migration-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const db = new DatabaseSync(path.join(dir, 'guestbook.sqlite'));
  db.exec("CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', createdAt TEXT NOT NULL, reviewedAt TEXT); INSERT INTO messages (nickname, body, status, createdAt) VALUES ('旧留言', '保留', 'approved', '2026-10-08');");
  db.close();
  assert.equal(createGuestbook(dir).list().items[0].body, '保留');
  assert.equal(createGuestbook(dir).list({privateFields:true}).items[0].visibility, 'public');
});

test('author replies and deletion require auth and preserve message privacy', async t => {
  const {req, auth, dir} = await setup(t);
  const store = createGuestbook(dir);
  for (const visibility of ['public','private']) store.submit({nickname:'访客',body:'问题',visibility});
  const messages = store.list({status:'pending',privateFields:true}).items;
  for (const message of messages) {
    const url = `/admin/api/guestbook/${message.id}`;
    assert.equal((await req(url+'/reply','PUT',{reply:'回复'})).status,401);
    assert.equal((await req(url+'/reply','PUT',{reply:'回复'},{Cookie:auth.Cookie})).status,403);
    assert.equal((await req(url+'/reply','PUT',{reply:'x'.repeat(2001)},auth)).status,400);
    assert.equal((await req(url+'/reply','PUT',{reply:'<script>作者回复</script>'},auth)).status,200);
    assert.equal(store.list().items.length,0);
    store.moderate(message.id,{status:'approved'});
    const visible = store.list().items;
    assert.equal(visible.some(m=>m.id===message.id),message.visibility==='public');
    const saved = createGuestbook(dir).list({privateFields:true}).items.find(m=>m.id===message.id);
    assert.equal(saved.reply,'<script>作者回复</script>');
    assert.ok(saved.repliedAt);
    assert.equal((await req(url+'/reply','PUT',{reply:''},auth)).status,200);
    assert.equal((await req(url,'DELETE')).status,401);
    assert.equal((await req(url,'DELETE',undefined,{Cookie:auth.Cookie})).status,403);
    assert.equal((await req(url,'DELETE',undefined,{...auth,Origin:'https://evil.example'})).status,403);
    assert.equal((await req(url,'DELETE',undefined,auth)).status,200);
    assert.equal(createGuestbook(dir).list({privateFields:true}).items.some(m=>m.id===message.id),false);
    assert.equal((await req(url+'/reply','PUT',{reply:'不存在'},auth)).status,404);
    assert.equal((await req(url,'DELETE',undefined,auth)).status,404);
  }
});

test('admin default all keeps approved and rejected messages until explicit deletion', async t => {
  const {req, auth} = await setup(t);
  await req('/api/guestbook','POST',{nickname:'访客',body:'保留在后台'});
  const read = async () => (await (await req('/admin/api/guestbook','GET',undefined,auth)).json()).items;
  const id = (await read())[0].id;
  for (const status of ['approved','rejected','pending']) {
    await req(`/admin/api/guestbook/${id}`,'PATCH',{status},auth);
    assert.equal((await read())[0].id,id);
    assert.equal((await read())[0].status,status);
  }
  assert.equal((await (await req('/api/guestbook?status=all')).json()).items.length,0);
  await req(`/admin/api/guestbook/${id}`,'DELETE',undefined,auth);
  assert.equal((await read()).length,0);
});
