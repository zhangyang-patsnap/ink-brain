import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseRecord } from '../schema.mjs';

const [project] = JSON.parse(await readFile(new URL('../../web/src/data/projects.json', import.meta.url), 'utf8'));
const record = { id: project.slug, data: project, body: '', included: true };

test('project reference facts are optional, editable and preserved by validation', () => {
  assert.equal(parseRecord('projects', record, record.id).data.license, undefined);
  const edited = structuredClone(record);
  edited.data.license = 'Apache-2.0';
  edited.data.languages = ['Rust', 'TypeScript'];
  const parsed = parseRecord('projects', edited, record.id);
  assert.equal(parsed.data.license, 'Apache-2.0');
  assert.deepEqual(parsed.data.languages, ['Rust', 'TypeScript']);
  edited.data.license = '';
  edited.data.languages = [];
  assert.equal(parseRecord('projects', edited, record.id).data.license, '');
  edited.data.languages = 'Rust';
  assert.throws(() => parseRecord('projects', edited, record.id));
});
