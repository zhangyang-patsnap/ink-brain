import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { inspectSkillPackage, parseSkillDocument, limits } from '../skill-package.mjs';
import { buildZip, skillZip } from './zip-fixture.mjs';

const refuses = (buffer, pattern) =>
  assert.throws(() => inspectSkillPackage(buffer), pattern);

test('archive metadata is read from SKILL.md and the manifest', () => {
  const report = inspectSkillPackage(skillZip());
  assert.equal(report.name, 'demo-skill');
  assert.equal(report.summary, '示例说明');
  assert.equal(report.version, '2.1.0');
  assert.equal(report.entryPath, 'SKILL.md');
  assert.equal(report.documentation, '# 示例\n\n正文。');
  assert.equal(report.manifestSource, 'skill.manifest.json');
});

test('a wrapper folder is stripped and outside entries are ignored', () => {
  const report = inspectSkillPackage(buildZip([
    { name: 'pack/SKILL.md', data: '---\nname: wrapped\n---\n\n正文' },
    { name: 'pack/references/notes.md', data: '# 参考' },
    { name: 'stray/other.md', data: '# 包装目录外' },
  ]));
  assert.equal(report.root, 'pack');
  assert.equal(report.entryPath, 'SKILL.md');
  assert.equal(report.fileCount, 2);
  assert.ok(report.notes.some(note => note.includes('包装目录 pack/')));
  assert.ok(report.notes.some(note => note.includes('忽略了包装目录外的 1 个文件')));
});

test('a flat archive needs no wrapper and falls back to the manifest', () => {
  const report = inspectSkillPackage(buildZip([
    { name: 'SKILL.md', data: '# 只有正文' },
    { name: '.skill-meta.json', data: JSON.stringify({ skill: { name: 'meta-only', description: '来自清单' }, version: '9.9' }) },
  ]));
  assert.equal(report.root, '');
  assert.equal(report.name, 'meta-only');
  assert.equal(report.summary, '来自清单');
  assert.equal(report.version, '9.9');
  assert.equal(report.manifestSource, '.skill-meta.json');
});

test('SKILL.md deeper than one level is not treated as the entry document', () => {
  refuses(buildZip([{ name: 'a/b/SKILL.md', data: '# 太深' }]), /没有找到 SKILL.md/);
  refuses(buildZip([{ name: 'pack/readme.md', data: '# 无入口' }]), /没有找到 SKILL.md/);
});

test('traversal, absolute and backslash paths are refused before normalization', () => {
  for (const name of [
    '../escape/SKILL.md',
    'pack/../../escape/SKILL.md',
    '/abs/SKILL.md',
    'C:/win/SKILL.md',
    'pack\\win\\SKILL.md',
    'pack//empty/SKILL.md',
    './SKILL.md',
  ])
    refuses(buildZip([{ name, data: '# 恶意' }]), /路径不合法|没有找到 SKILL.md/);
});

test('symbolic link entries are refused', () => {
  refuses(
    buildZip([
      { name: 'SKILL.md', data: '# 正常' },
      { name: 'link', data: '/etc/passwd', mode: 0o120777 },
    ]),
    /符号链接/,
  );
});

test('macOS noise is skipped instead of failing the archive', () => {
  const report = inspectSkillPackage(buildZip([
    { name: '__MACOSX/._SKILL.md', data: 'junk' },
    { name: 'SKILL.md', data: '# 正常' },
    { name: '.DS_Store', data: 'junk' },
  ]));
  assert.equal(report.fileCount, 1);
  assert.equal(report.documentation, '# 正常');
});

test('entry count, single size, total size and ratio limits are enforced', () => {
  refuses(
    buildZip(Array.from({ length: limits.maxEntries + 1 }, (_, i) => ({ name: `f${i}.md`, data: 'x' }))),
    /条目过多/,
  );
  refuses(
    buildZip([{ name: 'SKILL.md', data: 'x'.repeat(limits.maxEntryBytes + 1) }]),
    /单文件/,
  );
  // 用不可压缩内容，避免先撞上压缩比上限。
  const chunk = Buffer.from(
    Array.from({ length: limits.maxEntryBytes - 1024 }, (_, i) => (i * 2654435761) % 251),
  );
  refuses(
    buildZip(Array.from({ length: 6 }, (_, i) => ({ name: `big${i}.md`, data: chunk, store: true }))),
    /解压后超过/,
  );
});

test('a declared-size lie is caught by the second pass on real bytes', () => {
  // 中央目录声称 12 字节，实际解压出远超单文件上限的内容。
  const payload = Buffer.alloc(limits.maxEntryBytes + 4096, 0x61);
  const body = deflateRawSync(payload);
  refuses(
    buildZip([{ name: 'SKILL.md', data: payload, declaredSize: 12, declaredCompressed: body.length }]),
    /无法解压或超过单文件上限|单文件/,
  );
});

test('a compression-ratio bomb is refused', () => {
  refuses(
    buildZip([{ name: 'SKILL.md', data: 'a'.repeat(limits.maxEntryBytes - 1), declaredCompressed: 8 }]),
    /压缩比异常|单文件/,
  );
});

test('encrypted, duplicated and malformed archives are refused', () => {
  refuses(buildZip([{ name: 'SKILL.md', data: '# 加密', flags: 0x0001 }]), /加密/);
  refuses(
    buildZip([{ name: 'SKILL.md', data: '# 一' }, { name: 'SKILL.md', data: '# 二' }]),
    /重复条目/,
  );
  refuses(Buffer.from('not a zip at all'), /不是有效的 ZIP/);
  refuses(Buffer.concat([Buffer.from('PK'), Buffer.alloc(40)]), /无法识别|损坏/);
});

test('non-UTF-8 and unsupported compression are refused', () => {
  refuses(
    buildZip([{ name: 'SKILL.md', data: Buffer.from([0xff, 0xfe, 0x00, 0x41]) }]),
    /不是 UTF-8 文本/,
  );
});

test('front matter is anchored so a --- inside a value does not split it', () => {
  const parsed = parseSkillDocument('---\nname: demo\ndescription: "a --- b"\n---\n\n# 正文\n');
  assert.equal(parsed.meta.name, 'demo');
  assert.equal(parsed.meta.description, 'a --- b');
  assert.equal(parsed.body, '# 正文');
  assert.equal(parsed.frontMatterError, '');
});

test('broken front matter keeps the body and reports a note', () => {
  const parsed = parseSkillDocument('---\nname: [unclosed\n---\n\n# 正文\n');
  assert.equal(parsed.body, '# 正文');
  assert.ok(parsed.frontMatterError);
  const report = inspectSkillPackage(buildZip([{ name: 'SKILL.md', data: '---\nname: [unclosed\n---\n\n# 正文\n' }]));
  assert.equal(report.documentation, '# 正文');
  assert.ok(report.notes.some(note => note.includes('frontmatter')));
});

test('a corrupt manifest does not stop SKILL.md from being read', () => {
  const report = inspectSkillPackage(buildZip([
    { name: 'SKILL.md', data: '---\nname: ok\n---\n\n# 正文' },
    { name: 'skill.manifest.json', data: '{ not json' },
  ]));
  assert.equal(report.name, 'ok');
  assert.equal(report.documentation, '# 正文');
});

test('an empty body is reported as a note', () => {
  const report = inspectSkillPackage(buildZip([{ name: 'SKILL.md', data: '---\nname: empty\n---\n' }]));
  assert.equal(report.documentation, '');
  assert.ok(report.notes.some(note => note.includes('正文为空')));
});

test('over-long name, summary and version are clamped to the schema limits', () => {
  const long = '这是一段很长的说明。'.repeat(60);
  const report = inspectSkillPackage(buildZip([{
    name: 'SKILL.md',
    data: `---\nname: ${'n'.repeat(300)}\ndescription: ${long}\nversion: "${'9'.repeat(150)}"\n---\n\n# 正文`,
  }]));
  assert.ok(report.name.length <= 240, `name ${report.name.length}`);
  assert.ok(report.summary.length <= 240, `summary ${report.summary.length}`);
  assert.ok(report.version.length <= 100, `version ${report.version.length}`);
  for (const hint of ['名称过长', '包内简介过长', '版本号过长'])
    assert.ok(report.notes.some(note => note.includes(hint)), hint);
  // 截断落在句子边界上，不留半句话。
  assert.ok(report.summary.endsWith('。'), JSON.stringify(report.summary.slice(-12)));
  // 完整说明仍然保留在正文里。
  assert.equal(report.documentation, '# 正文');
});

test('a manifest description is clamped too, and short values stay untouched', () => {
  const report = inspectSkillPackage(buildZip([
    { name: 'SKILL.md', data: '# 正文' },
    { name: 'skill.manifest.json', data: JSON.stringify({ name: 'ok', description: 'x'.repeat(400), version: '1.0.0' }) },
  ]));
  assert.equal(report.name, 'ok');
  assert.equal(report.summary.length, 240);
  assert.equal(report.version, '1.0.0');
  assert.ok(report.notes.some(note => note.includes('包内简介过长')));
  const plain = inspectSkillPackage(buildZip([{ name: 'SKILL.md', data: '---\nname: short\ndescription: 简短说明\nversion: 1.0.0\n---\n\n# 正文' }]));
  assert.equal(plain.summary, '简短说明');
  assert.equal(plain.notes.filter(note => note.includes('过长')).length, 0);
});

test('an unquoted version keeps its literal text instead of becoming a number', () => {
  // YAML 会把 1.0 解析成数字 1，丢掉尾部的 0；这里必须保留作者写的字面量。
  for (const [written, expected] of [['1.0', '1.0'], ['2.10', '2.10'], ['"2.1.0"', '2.1.0'], ['1.0.1', '1.0.1']]) {
    const report = inspectSkillPackage(buildZip([
      { name: 'SKILL.md', data: `---\nname: demo\nversion: ${written}\n---\n\n# 正文` },
    ]));
    assert.equal(report.version, expected, written);
  }
});
