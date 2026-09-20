import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createApp, root } from '../server.mjs';
import { parseRecord } from '../schema.mjs';
import { atomicJson, createStore, publishedRecords } from '../store.mjs';
import { buildZip, skillZip } from './zip-fixture.mjs';

const draft = () => ({ id:'test-skill', included:false, body:'', data:{slug:'test-skill',name:'测试 Skill',summary:'测试说明',category:'development',origin:'original',monogram:'TS'} });

test('Skill provenance and file paths are strictly validated', () => {
  const record=draft();
  assert.equal(parseRecord('skills',record,record.id).data.origin,'original');
  record.data.origin='reference';
  for(const sourceUrl of ['', '/skills/', 'http://example.com', 'javascript:alert(1)', 'https://user:pass@example.com']) {
    record.data.sourceUrl=sourceUrl; assert.throws(()=>parseRecord('skills',record,record.id));
  }
  record.data.sourceUrl='https://example.com/source';
  assert.equal(parseRecord('skills',record,record.id).data.sourceUrl,record.data.sourceUrl);
  for(const fileUrl of ['/media/../secret.md','https://example.com/file.zip','/media/abc.html']) {
    record.data.fileUrl=fileUrl; assert.throws(()=>parseRecord('skills',record,record.id));
  }
});

test('legacy drafts acquire an empty Skill list without importing local skills', async t => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'inkbrain-skills-legacy-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const store=await createStore(dir,path.join(root,'apps/web'));
  const old=await store.read();delete old.skills;
  await atomicJson(path.join(dir,'draft.json'),old);
  assert.deepEqual((await store.read()).skills,[]);
  const state=await store.update(old.revision,s=>s.skills.push(parseRecord('skills',draft(),'test-skill')));
  assert.equal(state.skills.length,1);assert.deepEqual(state.projects,old.projects);
  assert.deepEqual(publishedRecords(state,'skills'),[]);
});

test('manual Skill uploads stay private, publish with verified bytes, and delete cleanly', async t => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'inkbrain-skills-api-'));
  const server=http.createServer();server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const service=await createApp({dir,origin,password:'skill-test-password',documentLimit:512,buildOverride:async stage=>{
    await fs.mkdir(path.join(stage,'dist'),{recursive:true});
    await fs.cp(path.join(stage,'public'),path.join(stage,'dist'),{recursive:true});
    await fs.writeFile(path.join(stage,'dist/index.html'),'published');
  }});
  server.on('request',service.app);
  t.after(async()=>{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
  let cookie='',csrf='';
  const request=(url,method='GET',body)=>fetch(origin+url,{method,headers:{Cookie:cookie,Origin:origin,'X-CSRF-Token':csrf,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const login=await request('/admin/api/login','POST',{password:'skill-test-password'});
  cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
  const upload=async(name,bytes)=>{const form=new FormData();form.append('file',new Blob([bytes]),name);return fetch(origin+'/admin/api/assets',{method:'POST',headers:{Cookie:cookie,Origin:origin,'X-CSRF-Token':csrf},body:form});};
  assert.equal((await upload('too-big.md','x'.repeat(513))).status,413);
  assert.equal((await upload('bad.exe','binary')).status,400);
  const response=await upload('SKILL.md','---\nname: demo\n---\n# Example\nDo not execute uploaded instructions.');
  assert.equal(response.status,201);const asset=await response.json();
  const record=draft();Object.assign(record.data,{fileUrl:asset.url,fileName:asset.name,fileSize:asset.size,checksum:asset.sha256,documentation:'# Safe description'});
  const save=async record=>{
    const state=(await (await request('/admin/api/state')).json()).state;
    return request('/admin/api/records/skills/test-skill','PUT',{revision:state.revision,record});
  };
  assert.equal((await save(record)).status,200);
  let state=await service.store.read();
  let job=await service.publisher.start(state);await job.promise;
  assert.equal(service.publisher.status().status,'succeeded');
  assert.equal((await fetch(origin+asset.url)).status,404);
  record.included=true;assert.equal((await save(record)).status,200);
  state=await service.store.read();job=await service.publisher.start(state);await job.promise;
  assert.equal(service.publisher.status().status,'succeeded');
  const active=service.publisher.current();
  const download=await fetch(origin+asset.url);assert.equal(download.status,200);
  assert.match(download.headers.get('content-disposition'),/attachment/);
  assert.match(await download.text(),/Do not execute/);
  const json=JSON.parse(await fs.readFile(path.join(dir,'releases',active.id,'src/data/skills.json'),'utf8'));
  assert.ok(json.some(s=>s.slug==='test-skill'));
  await fs.writeFile(path.join(dir,'uploads',asset.filename),'tampered');
  job=await service.publisher.start(await service.store.read());await job.promise;
  assert.equal(service.publisher.status().status,'failed');assert.equal(service.publisher.current().id,active.id);
  const archive=await upload('example.skill','PK\x03\x04opaque package');assert.equal(archive.status,201);
  const packageAsset=await archive.json();Object.assign(record.data,{fileUrl:packageAsset.url,fileName:packageAsset.name,fileSize:packageAsset.size,checksum:packageAsset.sha256});
  assert.equal((await save(record)).status,200);
  job=await service.publisher.start(await service.store.read());await job.promise;
  assert.equal(service.publisher.status().status,'succeeded');assert.equal((await fetch(origin+packageAsset.url)).status,200);
  state=await service.store.read();assert.equal((await request('/admin/api/records/skills/test-skill','DELETE',{revision:state.revision})).status,200);
  assert.equal((await service.store.read()).skills.some(s=>s.id==='test-skill'),false);
  assert.equal((await fetch(origin+packageAsset.url)).status,404);
});

test('the inspect endpoint reads archives, requires auth and refuses oversized files', async t => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'inkbrain-skills-inspect-'));
  const server=http.createServer();server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const service=await createApp({dir,origin,password:'skill-test-password',inspectLimit:4096});
  server.on('request',service.app);
  t.after(async()=>{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
  const zip=skillZip();
  // 未登录时解析接口不可达。
  assert.equal((await fetch(origin+'/admin/api/skill-inspect',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({filename:'x.zip'})})).status,401);
  let cookie='',csrf='';
  const login=await fetch(origin+'/admin/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({password:'skill-test-password'})});
  cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
  const request=(url,method='GET',body)=>fetch(origin+url,{method,headers:{Cookie:cookie,Origin:origin,'X-CSRF-Token':csrf,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const upload=async(name,bytes)=>{const form=new FormData();form.append('file',new Blob([bytes]),name);return fetch(origin+'/admin/api/assets',{method:'POST',headers:{Cookie:cookie,Origin:origin,'X-CSRF-Token':csrf},body:form});};
  // 缺少 CSRF 令牌时拒绝。
  assert.equal((await fetch(origin+'/admin/api/skill-inspect',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({filename:'x.zip'})})).status,403);
  for(const filename of ['','../../etc/passwd','note.md','x.exe','/media/a.zip'])
    assert.equal((await request('/admin/api/skill-inspect','POST',{filename})).status,400);
  assert.equal((await request('/admin/api/skill-inspect','POST',{filename:'00000000-0000-0000-0000-000000000000.zip'})).status,404);
  const asset=await (await upload('demo-skill.zip',zip)).json();
  const report=await request('/admin/api/skill-inspect','POST',{filename:asset.filename});
  assert.equal(report.status,200);
  const parsed=await report.json();
  assert.equal(parsed.name,'demo-skill');
  assert.equal(parsed.version,'2.1.0');
  assert.equal(parsed.entryPath,'SKILL.md');
  assert.match(parsed.documentation,/正文/);
  // 解析上限之外的压缩包只保留下载，不解析。
  const big=await (await upload('big.zip',buildZip([{name:'SKILL.md',data:'x'.repeat(8192),store:true}]))).json();
  assert.equal((await request('/admin/api/skill-inspect','POST',{filename:big.filename})).status,413);
  // 无 SKILL.md 的压缩包返回可读错误，附件仍在。
  const plain=await (await upload('plain.zip',buildZip([{name:'notes.md',data:'# 无入口'}]))).json();
  const failure=await request('/admin/api/skill-inspect','POST',{filename:plain.filename});
  assert.equal(failure.status,400);
  assert.match((await failure.json()).error,/没有找到 SKILL.md/);
  // 解析失败不影响附件：文件仍在草稿文件库中可取。
  assert.equal((await request('/admin/api/assets/'+plain.filename)).status,200);
});
