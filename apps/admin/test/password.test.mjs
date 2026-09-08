import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAuth } from '../auth.mjs';

test('password setup rejects five characters and accepts six; six-character login works', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inkbrain-password-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const auth = await createAuth({ dir, origin: 'http://127.0.0.1:4322', allowSetup: true });
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, setHeader() {} });
  let res = response();
  await auth.setup({ body: { password: 'abc12' } }, res);
  assert.equal(res.code, 400);
  assert.equal(auth.configured(), false);
  res = response();
  await auth.setup({ body: { password: 'abc123' } }, res);
  assert.equal(res.body.authenticated, true);
  res = response();
  auth.login({ body: { password: 'abc123' }, socket: { remoteAddress: '127.0.0.1' } }, res);
  assert.equal(res.body.authenticated, true);
});
