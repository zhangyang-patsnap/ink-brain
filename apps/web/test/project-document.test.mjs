import test from 'node:test';
import assert from 'node:assert/strict';
import { projectLinks, projectDocument } from '../src/lib/project-document.mjs';

test('project resources accept only configured web URLs and deduplicate canonical addresses', () => {
  assert.deepEqual(projectLinks([' https://example.org ', 'https://example.org/', 'javascript:alert(1)', '//example.org', '', 'https://', 'https://user:pass@example.org']), ['https://example.org/']);
  assert.deepEqual(projectLinks([], 'https://example.org/docs'), ['https://example.org/docs']);
  assert.deepEqual(projectLinks(undefined, 'http://localhost:8080'), ['http://localhost:8080/']);
  assert.deepEqual(projectLinks(['https://example.org/new'], 'https://example.org/old'), ['https://example.org/new']);
  assert.deepEqual(projectLinks(undefined, undefined), []);
});

test('README directory is static, unique, escaped and semantically below the page heading', () => {
  const result = projectDocument('# 项目 & API\n\n## **安装**\n\n## **安装**\n\n### 细节\n\n```html\n<h1>不是标题</h1>\n```');
  assert.equal(result.toc.length, 3);
  assert.equal(new Set(result.toc.map(item => item.id)).size, 3);
  assert.deepEqual(result.toc.map(item => item.depth), [0, 1, 1]);
  assert.equal(result.toc[0].label, '项目 &amp; API');
  assert.equal(result.toc[1].label, '安装');
  assert.match(result.html, /<h3 id="project-readme-section-1">/);
  assert.match(result.html, /<h5 id="project-readme-section-4">/);
  assert.doesNotMatch(result.html, /<h[12]/);
  for (const item of result.toc) assert.ok(result.html.includes(`id="${item.id}"`));
});

test('README keeps code, table, images and Mermaid while removing executable content', () => {
  const result = projectDocument('## 安全 <img src="x" onerror="alert(1)">\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n![图](/image.png)\n\n```mermaid\ngraph LR\n A-->B\n```');
  assert.doesNotMatch(result.html, /onerror|<script|javascript:/);
  assert.doesNotMatch(result.toc[0].label, /<img/);
  assert.match(result.html, /<table>/);
  assert.match(result.html, /src="\/image.png"/);
  assert.match(result.html, /class="language-mermaid"/);
});

test('empty and heading-less READMEs have no invented directory entries', () => {
  assert.deepEqual(projectDocument(''), { html: '', toc: [] });
  assert.deepEqual(projectDocument('说明').toc, []);
});

test('embedded project README starts below page, project and section headings', () => {
  const document = projectDocument('# 概览\n\n## 安装\n\n### 运行', { startLevel: 4 });
  assert.match(document.html, /<h4 id="project-readme-section-1">概览/);
  assert.match(document.html, /<h5 id="project-readme-section-2">安装/);
  assert.match(document.html, /<h6 id="project-readme-section-3">运行/);
  assert.doesNotMatch(document.html, /<h[123]/);
});

test('reference layout renders README headings as peers of introduction and capabilities', () => {
  const result = projectDocument('## 快速开始\n\n### 配置示例', { startLevel: 3 });
  assert.match(result.html, /<h3 id="project-readme-section-1">快速开始/);
  assert.match(result.html, /<h4 id="project-readme-section-2">配置示例/);
  assert.deepEqual(result.toc.map(item => item.depth), [0, 1]);
});
