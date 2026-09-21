const $ = (s) => document.querySelector(s);
const app = $("#app"),
  notice = $("#notice");
let theme =
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";
let richHydrating = false;
// 已记录过初始宽度的图片。每张图片的首次 ResizeObserver 回调属于载入，不是作者的修改。
let richMeasured = new WeakSet();
let richImageHandler = null;
let richResizeObserver = null;
function applyTheme(nextTheme) {
  theme = nextTheme;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("inkbrain-theme", theme);
  } catch {}
}
const names = {
  dashboard: "概览",
  articles: "文章",
  knowledge: "专题",
  projects: "项目",
  tools: "工具",
  skills: "Skill",
  tags: "标签",
  assets: "文件库",
  settings: "站点设置",
  help: "使用说明",
};
const validPages = new Set(Object.keys(names));
const pageFromLocation = () => {
  const candidate = location.hash.slice(1);
  return validPages.has(candidate) ? candidate : "dashboard";
};
const rememberPage = () => {
  const next = page === "dashboard" ? location.pathname : `#${page}`;
  history.replaceState(null, "", next);
};
const labels = {
  title: "标题",
  name: "名称",
  summary: "摘要",
  topic: "主题",
  maturity: "证据成熟度",
  demo: "这是 Demo 示例",
  related: "相关内容",
  publishedAt: "发布日期",
  tags: "标签（可多选）",
  readingMinutes: "阅读分钟数",
  draft: "内容草稿标记",
  order: "排序",
  thesis: "专题主张",
  concepts: "关键概念",
  learningPath: "学习路径",
  references: "关联内容标识",
  articles: "文章",
  labs: "实验",
  projects: "项目",
  tools: "工具",
  adjacent: "相邻专题",
  description: "说明",
  type: "项目类型",
  status: "项目状态",
  tagline: "一句话介绍",
  stack: "技术栈",
  license: "代码协议（选填）",
  languages: "主要语言（选填）",
  capabilities: "能力",
  evidence: "证据",
  documentation: "文档说明",
  repositoryUrl: "源码仓库地址",
  documentationUrl: "文档地址",
  label: "链接名称",
  href: "链接地址",
  domain: "所属栏目",
  monogram: "图标缩写",
  kind: "工具类型",
  platform: "平台",
  availability: "下载状态",
  features: "功能",
  screenshots: "截图",
  src: "图片地址",
  alt: "图片描述",
  relatedProject: "关联项目标识",
  release: "发布版本",
  version: "版本号",
  packageFormat: "包格式",
  fileSize: "文件大小",
  requirements: "系统要求",
  releasedAt: "发布日期",
  checksum: "SHA-256",
  notes: "版本说明",
  downloadUrl: "下载地址",
  author: "作者",
  intro: "首页介绍",
  bio: "关于作者",
};
const enums = {
  maturity: ["idea", "studied", "implemented", "verified", "production"],
  type: ["Agent Framework", "Application", "Library", "Other"],
  status: ["concept", "building", "released", "verified"],
  kind: ["macos-app", "cli", "plugin", "web-tool"],
  availability: ["demo", "available", "retired"],
  domain: ["Writing", "Knowledge", "Lab", "Tool"],
};
const templates = {
  repositoryUrls: "",
  documentationUrls: "",
  learningPath: { title: "", description: "" },
  related: { label: "", href: "", domain: "Writing" },
  screenshots: { src: "", alt: "" },
};
const articleDataKeys = new Set([
  "title",
  "summary",
  "publishedAt",
  "tags",
  "readingMinutes",
  "draft",
]);
const articleData = (data) =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) => articleDataKeys.has(key)),
  );
let csrf = "",
  snapshot,
  assets = [],
  previewObjectUrls = [],
  page = "dashboard",
  editing = null,
  dirty = false,
  skillReport = null,
  richEditor = null;
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let noticeTimer;
const notify = (s, error = false) => {
  clearTimeout(noticeTimer);
  notice.textContent = s;
  notice.className = error ? "error" : "";
  if (snapshot && $("main header .badge"))
    $("main header .badge").textContent =
      `草稿 v${snapshot.state.revision} · ${snapshot.active ? `已发布 v${snapshot.active.revision}` : "尚未发布"}`;
  if (!error) noticeTimer = setTimeout(() => (notice.textContent = ""), 7000);
};
async function api(url, method = "GET", body) {
  const res = await fetch("/admin/api/" + url, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
    },
    ...(body === undefined
      ? {}
      : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
  const raw = await res.text();
  let data = {};
  if (raw.trim()) {
    try { data = JSON.parse(raw); } catch { throw Error(`接口返回格式错误（HTTP ${res.status}）`); }
  }
  if (!res.ok) throw Error(data.error ?? "请求失败");
  return data;
}
async function refresh() {
  snapshot = await api("state");
  assets = await api("assets");
  if ($("main header .badge"))
    $("main header .badge").textContent =
      `草稿 v${snapshot.state.revision} · ${snapshot.active ? `已发布 v${snapshot.active.revision}` : "尚未发布"}`;
}
function shell() {
  const nextTheme = theme === "dark" ? "日间模式" : "夜间模式";
  const themeIcon =
    theme === "dark"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"></path></svg>';
  app.innerHTML = `<div class="layout"><aside class="sidebar"><div class="brand">InkBrain<span aria-hidden="true">.</span></div><div class="eyebrow">AUTHOR WORKSPACE</div><nav aria-label="管理导航">${Object.entries(
    names,
  )
    .map(
      ([id, label]) =>
        `<button data-page="${id}" ${id === page ? 'aria-current="page"' : ""}>${label}</button>`,
    )
    .join(
      "",
    )}</nav><div class="bottom"><a href="/" target="_blank" rel="noopener">打开已发布站点 ↗</a><a href="/admin/api/export">导出内容备份</a><button data-action="logout">退出登录</button></div></aside><main id="main"><header><div><h1>${names[page]}</h1><div class="muted">以墨为迹，让思想生长。</div></div><div class="header-tools"><span class="badge">草稿 v${snapshot.state.revision} · ${snapshot.active ? `已发布 v${snapshot.active.revision}` : "尚未发布"}</span><button class="theme-toggle" data-action="theme" aria-label="切换为${nextTheme}" title="切换为${nextTheme}">${themeIcon}</button><button class="publish-site" data-action="publish">发布</button></div></header><div id="content"></div></main></div>`;
}
function draw() {
  shell();
  const c = $("#content");
  if (page === 'skills' && !Array.isArray(snapshot.state.skills)) {
    c.innerHTML = '<section class="card"><h2>请重启后台服务</h2><p>Skill 页面已更新，当前 Node 进程仍在使用旧版接口。请按原启动方式重启后台，再刷新本页；已有内容不会删除。</p></section>';
    return;
  }
  if (["articles", "knowledge", "projects", "tools", "skills"].includes(page)) {
    if (editing) return editor();
    c.innerHTML = `<div class="toolbar"><button class="primary" data-action="new">新建${names[page]}</button><span class="help">修改可保存草稿或直接发布；删除会同步到站点。</span></div><div class="list">${snapshot.state[page].map((r) => `<div class="row"><button class="row-edit" data-edit="${r.id}"><span><strong>${escape(r.data.title ?? r.data.name)}</strong>${page === "articles" ? "" : `<small>${escape(r.id)}</small>`}</span>${page === "articles" ? "" : `<span class="badge">${r.included ? "公开内容" : "仅草稿"}</span>`}</button><button class="row-delete" data-delete="${r.id}" aria-label="删除${escape(r.data.title ?? r.data.name)}">删除</button></div>`).join("") || '<p class="empty">还没有内容，从第一篇开始。</p>'}</div>`;
  } else if (page === "dashboard") {
    c.innerHTML = `<div class="cards">${["articles", "knowledge", "projects", "tools"].map((k) => `<section class="card metric-card"><div class="metric-value"><span>${names[k]}</span><strong class="count">${snapshot.state[k].filter((r) => !r.archived).length}</strong></div><button data-page="${k}">管理${names[k]} <span aria-hidden="true">↗</span></button></section>`).join("")}</div><section class="card dashboard-guide"><div class="dashboard-guide-copy"><h2>保存，或者直接发布。</h2><p>编辑内容时可以保存为私人草稿，也可以保存并立即发布到访客站点。</p><p class="help">删除内容会直接同步发布；发布失败时，访客仍会看到上一个正常版本。</p></div><a class="button" href="/" target="_blank" rel="noopener">查看已发布站点 ↗</a></section>`;
  } else if (page === "help") {
    c.innerHTML = `<section class="card workspace-help"><h2>项目状态</h2><p class="help">描述项目本身的研发进展，方便读者了解当前阶段。</p><dl class="status-guide"><div><dt><code>concept</code><span>构思中</span></dt><dd>有想法或设计，尚未开始实现。</dd></div><div><dt><code>building</code><span>研发中</span></dt><dd>正在开发，功能还不完整。</dd></div><div><dt><code>released</code><span>已发布</span></dt><dd>已有可供他人使用的版本。</dd></div><div><dt><code>verified</code><span>已验证</span></dt><dd>经过测试或实际场景验证，有结果支撑。</dd></div></dl><div class="status-guide-note"><h3>与“保存并发布”的区别</h3><p>项目状态描述研发进展；“保存并发布”会把项目介绍页面发布到博客。研发中的项目也可以公开介绍，“已验证”不代表已经用于生产环境。</p></div></section>`;
    c.insertAdjacentHTML(
      "beforeend",
      `<section class="card workspace-help"><h2>项目类型</h2><p class="help">按项目的用途和使用方式选择，目前提供以下四类。</p><dl class="status-guide"><div><dt><code>Agent Framework</code><span>智能体框架</span></dt><dd>用于构建、运行智能体的框架，例如提供任务编排、工具调用、记忆等能力的自研 Agent 框架。</dd></div><div><dt><code>Application</code><span>应用</span></dt><dd>可以直接使用的完整应用或服务，例如 AI 助手、知识库问答系统、博客、后端业务服务。</dd></div><div><dt><code>Library</code><span>代码库</span></dt><dd>供其他项目引用的代码库、SDK 或组件，例如模型调用 SDK、协议解析库、日志组件。</dd></div><div><dt><code>Other</code><span>其他</span></dt><dd>暂时不属于以上三类的项目，例如学习实验、技术原型、配置或模板集合。</dd></div></dl><div class="status-guide-note"><h3>如何选择</h3><p>用户直接使用，选 Application；开发者引入代码使用，选 Library；开发者基于它搭建智能体，选 Agent Framework。暂时无法归类时选 Other。</p></div></section>`,
    );
    c.insertAdjacentHTML(
      "beforeend",
      `<section class="card workspace-help"><h2>本地启动与更新</h2><p class="help">修改网站代码后，按下面流程检查和预览。</p><div class="command-guide"><div><code>npm run dev</code><span>开发预览</span><p>启动 Astro 开发服务器，通常访问 <code>http://127.0.0.1:4321/</code>，修改代码后会自动刷新。</p></div><div><code>npm run check</code><span>类型检查</span><p>检查 Astro 和 TypeScript 是否存在错误。</p></div><div><code>npm run build</code><span>生成构建产物</span><p>生成 <code>apps/web/dist</code>。这一步不会自动更新 4322 游客站点。</p></div><div><code>npm run admin</code><span>启动后台</span><p>启动后台和已发布游客站点，访问 <code>http://127.0.0.1:4322/admin/</code>。</p></div></div><div class="status-guide-note"><h3>让修改对游客生效</h3><p>文章、专题、项目和工具可在后台保存后点击右上角“发布”。网站代码或样式修改完成后，也需要重新构建并发布，4322 才会切换到新版本。</p></div></section>`,
    );
    c.insertAdjacentHTML(
      "beforeend",
      `<section class="card workspace-help"><h2>内容存放位置</h2><p class="help">你保存的所有内容都在后台数据目录里，不在代码仓库里。</p><dl class="status-guide"><div><dt><code>draft.json</code><span>全部内容</span></dt><dd>文章、专题、项目、工具与 Skill 的正文和字段。</dd></div><div><dt><code>uploads/</code><span>上传的文件</span></dt><dd>图片、安装包与 Skill 压缩包的原始文件，和 <code>assets.json</code> 成对使用。</dd></div><div><dt><code>releases/</code><span>发布快照</span></dt><dd>每次发布生成的完整站点副本，游客看到的就是当前指向的那一份。</dd></div><div><dt><code>owner.json</code><span>登录密码</span></dt><dd>加盐哈希，不是明文。</dd></div></dl><div class="status-guide-note"><h3>线上不要放在仓库里</h3><p>数据目录默认是仓库根目录下的 <code>.inkbrain/</code>，本地开发用它没问题。但线上必须把 <code>ADMIN_DATA_DIR</code> 指向仓库之外的固定目录，例如 <code>/var/lib/inkbrain</code>；否则拉取代码、重新克隆仓库或更换部署目录时，已有内容可能一起消失。</p><p>配置方式是把仓库根目录的 <code>.env.example</code> 复制成 <code>.env</code> 后填写，这两个文件都不会提交到代码仓库。启动后台时终端会打印实际使用的数据目录，可以据此核对是否配置生效。</p><p>迁移已有部署时先停止服务，再整体移动数据目录。<code>assets.json</code> 与 <code>uploads/</code> 必须一起移动：发布时会逐字节校验附件的 SHA-256，只移动其中一个会导致发布失败。</p></div></section>`,
    );
  } else if (page === "tags") tagManager();
  else if (page === "assets") media();
  else if (page === "settings") {
    c.innerHTML = `<form id="settings-form" class="card"><div class="fields">${fields(snapshot.state.settings)}</div><div class="editor-actions"><span class="help">可以先保存草稿，也可以直接发布。</span><div class="editor-action-buttons"><button type="submit" data-save-mode="draft">保存草稿</button><button type="submit" class="primary" data-save-mode="publish">保存并发布</button></div></div></form>`;
  }
  if (page === 'help') c.insertAdjacentHTML('beforeend', '<section class="card"><h2>Skill 上传与发布</h2><ol><li>打开 Skill 栏目，新增并填写名称、分类、简介与详细说明。</li><li>来源选择“自研”或“引用”；引用必须填写 HTTPS 原始链接，不代表验证状态。</li><li>手动上传 Markdown（最多 2 MB）、ZIP 或 .skill（最多 256 MB）。压缩包不解包落盘、不执行其中内容。</li><li>上传压缩包后会读取包内 SKILL.md 与清单，自动填入名称、简介、版本与说明中尚未填写的部分；已填内容不会被覆盖。</li><li>可先保存草稿；上传文件后点击“保存并发布”，游客即可查看详情并下载。</li></ol><p>不会扫描或同步本地 Skill 目录。自动填入的说明只作为文本渲染，不会执行其中指令。引用内容请确认分享权限并保留作者、原始链接与许可证。新增功能需重启后台服务后生效。</p></section>');
}
function field(value, key, prefix) {
  if (
    page === "tools" &&
    prefix === "release" &&
    ["fileSize", "packageFormat"].includes(key)
  )
    return `<label class="field"><span>${labels[key]}</span><input value="${escape(value)}" readonly aria-readonly="true"></label>`;
  // 草稿里的 /media/ 要发布后才可访问，预览走后台的私有附件地址。
  if (page === "tools" && key === "src" && prefix.startsWith("screenshots.")) {
    const name = prefix + "." + key;
    const id = "f-" + name;
    return `<div class="field wide shot-field">
      <span class="shot-label">截图图片</span>
      <input type="hidden" name="${name}" value="${escape(value)}">
      ${value ? `<img class="shot-preview" src="${escape(shotPreview(value))}" alt="">` : '<p class="shot-empty">尚未上传图片。</p>'}
      <label class="shot-pick" for="${id}">
        <input type="file" id="${id}" data-shot-upload="${prefix}" accept=".png,.jpg,.jpeg,.webp">
        <span>${value ? "更换图片" : "选择或拖入图片"}</span>
      </label>
      <small>支持 PNG、JPEG、WebP，最多 256 MB。上传后自动填入地址。</small>
    </div>`;
  }
  if (page === "projects" && key === "documentation" && !prefix)
    return `<div class="project-documentation-editor"><label class="field" for="f-documentation"><span>文档说明 · Markdown</span><textarea id="f-documentation" name="documentation" class="project-markdown" placeholder="## 快速开始&#10;&#10;在这里编写项目文档…">${escape(value)}</textarea><small>支持标题、列表、链接、图片、表格和代码块。</small></label><div class="toolbar markdown-toolbar"><button type="button" data-action="project-markdown">预览文档</button></div><div id="project-markdown-preview" class="body-preview" hidden></div></div>`;
  const name = prefix ? prefix + "." + key : key,
    label = labels[key] ?? key,
    id = "f-" + name;
  const head = `<label class="field ${typeof value === "string" && value.length > 100 ? "wide" : ""}" for="${id}"><span>${escape(label)}</span>`;
  if (Array.isArray(value)) {
    if (
      value.some((v) => typeof v === "object") ||
      ["learningPath", "screenshots"].includes(key) ||
      (key === "related" && page === "projects")
    )
      return `<fieldset data-repeat="${name}"><legend>${escape(label)}</legend>${value.map((v, i) => `<div class="repeat-item"><div class="fields">${fields(v, name + "." + i)}</div><button type="button" data-remove="${name}.${i}">移除此项</button></div>`).join("")}<button type="button" data-add="${name}">添加一项</button></fieldset>`;
    if (key === "tags")
      return `${head}<select id="${id}" name="${name}" multiple data-type="multi">${snapshot.catalogs.tags.map(([id, title]) => `<option value="${id}" ${value.includes(id) ? "selected" : ""}>${escape(title)}</option>`).join("")}</select></label>`;
    return `${head}<textarea id="${id}" name="${name}" data-type="lines" placeholder="每行一项">${escape(value.join("\n"))}</textarea><small>每行一项${prefix.includes("references") ? "，填写内容的英文标识" : ""}</small></label>`;
  }
  if (value && typeof value === "object")
    return `<fieldset><legend>${escape(label)}</legend><div class="fields">${fields(value, name)}</div></fieldset>`;
  if (typeof value === "boolean")
    return `<label class="field check"><input type="checkbox" name="${name}" ${value ? "checked" : ""}>${escape(label)}</label>`;
  if (enums[key])
    return `${head}<select id="${id}" name="${name}">${enums[key].map((v) => `<option ${v === value ? "selected" : ""}>${escape(v)}</option>`).join("")}</select></label>`;
  if (["description", "summary", "intro", "bio", "documentation"].includes(key))
    return `${head}<textarea id="${id}" name="${name}">${escape(value)}</textarea></label>`;
  return `${head}<input id="${id}" name="${name}" value="${escape(value)}" type="${typeof value === "number" ? "number" : ["publishedAt", "releasedAt"].includes(key) ? "date" : "text"}"></label>`;
}
// 页面地址由名称推导。中文名推不出拉丁 slug，退回自动标识而不是生成 URL 编码的地址。
const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/, '');
// navigator.clipboard 同样只在安全上下文可用。HTTP 访问时退回选中文本，
// 由作者自己按快捷键复制，而不是抛错。
async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      notify("引用地址已复制");
      return;
    }
  } catch {
    // 权限被拒时走下面的兜底。
  }
  // 退回旧的 execCommand。它已废弃但在非安全上下文仍可用，是这里唯一的选择。
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
  document.body.append(field);
  field.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  field.remove();
  notify(
    copied
      ? "引用地址已复制"
      : "当前连接不是 HTTPS，浏览器不允许自动复制，请手动选中地址复制。",
    !copied,
  );
}
// crypto.randomUUID 只在安全上下文（HTTPS 或 localhost）可用，HTTP 访问时不存在。
// 这里的标识只需在草稿内唯一，不承担安全用途，退回 getRandomValues 或时间加随机数。
function randomHex(length) {
  if (crypto?.randomUUID) return crypto.randomUUID().replaceAll("-", "").slice(0, length);
  const bytes = new Uint8Array(Math.ceil(length / 2));
  if (crypto?.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}
// 仅在标识还是自动生成时跟随名称；已保存的记录地址不可更改。
function syncSkillId() {
  if (!editing?.isNew || !/^skill-[0-9a-f-]+$/.test(editing.id)) return false;
  const slug = slugify($('#f-name')?.value);
  const next =
    slug && !snapshot.state.skills.some((record) => record.id === slug)
      ? slug
      : editing.id;
  if (next === editing.id) return false;
  editing.id = next;
  editing.data.slug = next;
  if ($('#record-id')) $('#record-id').value = next;
  const address = $('#skill-address code');
  if (address) address.textContent = `/skills/${next}/`;
  return true;
}
// 只填空字段，不覆盖作者已填内容；重新上传不会刷新旧说明。
function fillFromSkillPackage(report) {
  const filled = [];
  // 接口已按 schema 上限截断，这里再兜一层：maxlength 管不住脚本写入的值。
  const caps = { name: 240, summary: 240, version: 100, documentation: 500000 };
  for (const [key, label] of [['name','名称'],['summary','简介'],['version','版本'],['documentation','详细说明']])
    if (report[key] && !String(editing.data[key] ?? '').trim()) {
      editing.data[key] = String(report[key]).slice(0, caps[key]);
      filled.push(label);
    }
  report.filled = filled;
  // 包名通常是可用的拉丁 slug，优先拿它定地址。
  if (editing.isNew && report.name && /^skill-[0-9a-f-]+$/.test(editing.id)) {
    const slug = slugify(report.name);
    if (slug && !snapshot.state.skills.some((record) => record.id === slug)) {
      // 服务端要求 slug 与 id 一致，两者一起改。
      editing.id = slug;
      editing.data.slug = slug;
      report.slug = slug;
    }
  }
  return report;
}
// 选择与拖入共用同一条上传路径。
async function receiveSkillFile(file) {
  if (!/\.(md|markdown|zip|skill)$/i.test(file.name))
    throw Error('请选择 Markdown、ZIP 或 .skill 文件');
  const markdown = /\.(md|markdown)$/i.test(file.name);
  if (file.size > (markdown ? 2 : 256) * 1024 * 1024)
    throw Error(markdown ? 'Markdown 不能超过 2 MB' : 'Skill 文件不能超过 256 MB');
  capture();
  const controls = [...app.querySelectorAll('button,input,select,textarea')];
  const wasDisabled = controls.map(control => control.disabled);
  controls.forEach(control => { control.disabled = true; });
  notify('正在上传 Skill 文件…');
  try {
    const asset = await uploadAsset(file);
    Object.assign(editing.data, { fileUrl:asset.url, fileName:asset.name, fileSize:asset.size, checksum:asset.sha256 });
    dirty = true;
    skillReport = null;
    if (markdown) {
      editor();
      notify('Skill 文件已上传。请填写说明，保存并发布后即可下载。');
      return;
    }
    notify('文件已上传，正在读取包内说明…');
    try {
      skillReport = await api('skill-inspect', 'POST', { filename: asset.filename });
      fillFromSkillPackage(skillReport);
      notify(`已读取 ${skillReport.entryPath}，请核对内容后保存。`);
    } catch (error) {
      skillReport = { failed: error.message };
      notify(`文件已保存，但未能读取说明：${error.message}`, true);
    }
    editor();
  } finally {
    controls.forEach((control,index) => { control.disabled = wasDisabled[index]; });
  }
}
// 上传截图并写回对应的 screenshots 项。path 形如 "screenshots.0"。
async function receiveShot(path, file) {
  if (!/\.(png|jpe?g|webp)$/i.test(file.name))
    throw Error("请选择 PNG、JPEG 或 WebP 图片");
  if (file.size > 256 * 1024 * 1024) throw Error("图片不能超过 256 MB");
  capture();
  const controls = [...app.querySelectorAll("button,input,select,textarea")];
  const wasDisabled = controls.map((control) => control.disabled);
  controls.forEach((control) => {
    control.disabled = true;
  });
  notify("正在上传截图…");
  try {
    const asset = await uploadAsset(file);
    const shot = get(editing.data, path);
    shot.src = asset.url;
    // 描述为空时先用文件名占位，提醒作者补一句真正的描述。
    if (!shot.alt?.trim()) shot.alt = asset.name.replace(/\.[^.]+$/, "");
    dirty = true;
    editor();
    notify("截图已上传，请补充图片描述。");
  } finally {
    controls.forEach((control, index) => {
      control.disabled = wasDisabled[index];
    });
  }
}
// 站内 /media/ 路径改写成后台附件地址，未发布的图片也能预览；外部 HTTPS 地址原样使用。
const shotPreview = (value) =>
  value.startsWith("/media/") ? value.replace("/media/", "/admin/api/assets/") : value;
const skillSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
const skillCategoryOptions = [['development','开发与调试'],['documents','文档与报告'],['design','设计与前端'],['data','数据与分析'],['operations','运维与观测'],['other','其他能力']];
// 上传区：未上传时是投放提示，已上传时显示解析摘要。
function skillPackagePanel(data) {
  const report = skillReport;
  const summary = report && !report.failed
    ? `<dl class="skill-parse-facts">
        <div><dt>包内文档</dt><dd><code>${escape(report.entryPath)}</code></dd></div>
        <div><dt>包内文件</dt><dd>${report.fileCount} 个 · 解压后 ${skillSize(report.totalBytes)}</dd></div>
        ${report.version ? `<div><dt>包声明版本</dt><dd>${escape(report.version)}</dd></div>` : ''}
      </dl>
      ${report.filled?.length ? `<p class="skill-parse-filled">已自动填入：${report.filled.map(escape).join('、')}${report.slug ? `，标识设为 <code>${escape(report.slug)}</code>` : ''}。可继续修改。</p>` : '<p class="skill-parse-filled">表单已有内容，未覆盖任何字段。</p>'}
      ${report.notes?.length ? `<ul class="skill-parse-notes">${report.notes.map(note=>`<li>${escape(note)}</li>`).join('')}</ul>` : ''}`
    : report?.failed
      ? `<p class="skill-parse-failed">未能读取包内说明：${escape(report.failed)}。文件已保存，可手工填写详细说明。</p>`
      : '';
  return `<section class="card skill-section skill-package-card">
    <header class="skill-section-head"><h2>Skill 包</h2><p>上传后自动读取包内 <code>SKILL.md</code> 填充空白字段。压缩包只读取说明与清单，不解包、不执行。</p></header>
    <label class="skill-drop" for="skill-package-upload">
      <input type="file" id="skill-package-upload" accept=".md,.markdown,.zip,.skill">
      <strong>${data.fileUrl ? '更换文件' : '选择或拖入 Skill 文件'}</strong>
      <span>SKILL.md、ZIP 或 .skill · Markdown 最多 2 MB，压缩包最多 256 MB（超过 64 MB 不解析说明）</span>
    </label>
    ${data.fileUrl
      ? `<div class="skill-file-card">
          <div class="skill-file-head"><strong>${escape(data.fileName)}</strong><span class="badge">${skillSize(data.fileSize)}</span></div>
          ${summary}
          <details class="skill-checksum"><summary>SHA-256</summary><code>${escape(data.checksum)}</code></details>
        </div>`
      : '<p class="skill-empty-note">尚未上传文件。可以先保存草稿，发布前必须上传。</p>'}
  </section>`;
}
function skillFields(data) {
  const reference = data.origin === 'reference';
  return `<section class="card skill-section">
    <header class="skill-section-head"><h2>能力身份</h2><p>决定列表展示与页面地址。</p></header>
    <div class="skill-grid">
      <label class="field span-3" for="f-name"><span>名称</span><input id="f-name" name="name" value="${escape(data.name)}" required maxlength="240" aria-describedby="skill-address"><input id="record-id" type="hidden" value="${escape(editing.id)}"><small id="skill-address" class="skill-address">页面地址 <code>/skills/${escape(editing.id)}/</code>${editing.isNew ? '，由名称自动生成' : '，发布后不可更改'}</small></label>
      <label class="field span-3" for="f-summary"><span>简介</span><textarea id="f-summary" name="summary" rows="2" required maxlength="240">${escape(data.summary)}</textarea><small>显示在能力列表与搜索结果。</small></label>
      <label class="field" for="f-category"><span>能力分类</span><select id="f-category" name="category">${skillCategoryOptions.map(([value,label])=>`<option value="${value}" ${data.category===value?'selected':''}>${label}</option>`).join('')}</select></label>
      <label class="field" for="f-monogram"><span>图标字符</span><input id="f-monogram" name="monogram" value="${escape(data.monogram)}" maxlength="5" required><small>列表左侧的短标记，1 到 5 个字符。</small></label>
      <label class="field" for="f-order"><span>排序</span><input id="f-order" name="order" type="number" min="0" value="${escape(data.order)}"><small>数字小的排在前面。</small></label>
      <label class="field" for="f-version"><span>版本</span><input id="f-version" name="version" value="${escape(data.version)}" maxlength="100" placeholder="1.0.0"></label>
      <label class="field" for="f-origin"><span>来源</span><select id="f-origin" name="origin"><option value="original" ${reference?'':'selected'}>自研</option><option value="reference" ${reference?'selected':''}>引用</option></select></label>
      ${reference
        ? `<label class="field span-2" for="f-sourceUrl"><span>原始链接</span><input id="f-sourceUrl" name="sourceUrl" type="url" value="${escape(data.sourceUrl)}" placeholder="https://" required><small>引用外部 Skill 必须注明来源，访客页会显示此链接。</small></label>`
        : `<input type="hidden" name="sourceUrl" value="${escape(data.sourceUrl)}">`}
      <label class="field check span-3"><input type="checkbox" name="featured" ${data.featured?'checked':''}><span>放入推荐能力</span></label>
    </div>
  </section>
  ${skillPackagePanel(data)}
  <section class="card skill-section">
    <header class="skill-section-head"><h2>详细说明</h2><p>Markdown 格式。上传压缩包时会自动填入包内 <code>SKILL.md</code> 正文。</p></header>
    <label class="field" for="f-skill-documentation"><span class="visually-hidden">详细说明</span><textarea id="f-skill-documentation" name="documentation" rows="18">${escape(data.documentation)}</textarea><small>建议写清适用场景、使用方法、输入输出、依赖与注意事项。说明只作为文本渲染，不会执行其中的指令。</small></label>
    <div class="skill-doc-actions"><button type="button" data-action="skill-preview">预览说明</button></div>
    <div id="skill-preview" class="body-preview" hidden></div>
  </section>`;
}
function fields(data, prefix = "") {
  return Object.entries(data)
    .filter(([k]) => !["slug", "draft"].includes(k))
    .map(([k, v]) => field(v, k, prefix))
    .join("");
}
function articleFields(data) {
  return `<label class="field wide" for="f-title"><span>标题</span><input id="f-title" name="title" value="${escape(data.title)}" required maxlength="240"></label><label class="field wide" for="f-summary"><span>摘要</span><textarea id="f-summary" name="summary" required maxlength="240">${escape(data.summary)}</textarea><small>用于文章列表和搜索结果。</small></label><div class="article-meta-fields"><label class="field" for="f-publishedAt"><span>发布日期</span><input id="f-publishedAt" name="publishedAt" value="${escape(data.publishedAt)}" type="date" required></label><label class="field" for="f-readingMinutes"><span>阅读时间</span><div class="input-suffix"><input id="f-readingMinutes" name="readingMinutes" value="${escape(data.readingMinutes)}" type="number" min="1" max="600" required><span>分钟</span></div></label></div><fieldset class="tag-picker"><legend>标签</legend><div class="tag-options">${snapshot.catalogs.tags.map(([id, title]) => `<label><input type="checkbox" name="tags" value="${id}" data-type="multi-check" ${data.tags.includes(id) ? "checked" : ""}><span>${escape(title)}</span></label>`).join("")}</div></fieldset>`;
}
function projectFields(data) {
  data.license ??= "";
  data.languages ??= [];
  data.repositoryUrls ??= data.repositoryUrl ? [data.repositoryUrl] : [];
  data.documentationUrls ??= data.documentationUrl
    ? [data.documentationUrl]
    : [];
  return `<section class="project-form-section"><div class="project-section-heading"><span>01</span><div><h2>基本信息</h2><p>定义项目是什么，以及它目前所处的阶段。</p></div></div><div class="project-form-grid project-basics">${field(data.name, "name", "")}<label class="field" for="record-id"><span>内容标识</span><input id="record-id" value="${escape(editing.id)}" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100" required ${editing.isNew ? "" : "readonly"}></label>${field(data.type, "type", "")}${field(data.status, "status", "")}${field(data.tagline, "tagline", "")}${field(data.summary, "summary", "")}</div></section><section class="project-form-section"><div class="project-section-heading"><span>02</span><div><h2>项目内容</h2><p>介绍技术栈、核心能力，并编写项目文档。</p></div></div><div class="project-form-grid project-content-fields">${field(data.stack, "stack", "")}${field(data.license, "license", "")}${field(data.languages, "languages", "")}${field(data.capabilities, "capabilities", "")}${field(data.documentation, "documentation", "")}</div></section><section class="project-form-section"><div class="project-section-heading"><span>03</span><div><h2>项目链接</h2><p>填写部署后的访问地址，也可添加多个源码仓库和文档入口。</p></div></div><label class="field project-visit-field" for="f-projectUrl"><span>项目访问地址</span><input id="f-projectUrl" name="projectUrl" type="url" value="${escape(data.projectUrl ?? "")}" placeholder="https://your-project.com" aria-describedby="project-url-help"><small id="project-url-help">选填，部署后填写；访客可通过“访问项目”直接打开。</small></label><div class="project-form-grid project-link-fields">${projectUrlList(data, "repositoryUrls", "源码仓库地址")}${projectUrlList(data, "documentationUrls", "文档地址")}</div></section>`;
}
function knowledgeFields(data) {
  data.items ??= ["articles", "projects", "tools"].flatMap((kind) =>
    (data.references?.[kind] ?? []).map((id) => ({ kind, id })),
  );
  return `<section class="project-form-section"><div class="project-form-grid"><label class="field wide" for="f-title"><span>专题名称</span><input id="f-title" name="title" value="${escape(data.title)}" required maxlength="240"></label><label class="field wide" for="f-summary"><span>简介</span><textarea id="f-summary" name="summary" required maxlength="240">${escape(data.summary)}</textarea></label></div></section><section class="project-form-section"><div class="project-section-heading"><div><h2>专题内容</h2><p>按阅读与实践顺序排列。移出专题不会删除原内容。</p></div></div><ol class="topic-editor-items">${
    data.items
      .map((ref, index) => {
        const record = snapshot.state[ref.kind]?.find(
          (item) => item.id === ref.id,
        );
        return `<li><span class="topic-editor-number">${index + 1}</span><div class="topic-editor-title"><small>${names[ref.kind]}${!record ? " · 已删除" : record.archived || (ref.kind !== "articles" && !record.included) ? " · 尚未发布" : ""}</small><strong>${escape(record?.data.title ?? record?.data.name ?? ref.id)}</strong></div><div class="topic-editor-actions"><button type="button" data-topic-up="${index}" aria-label="上移第 ${index + 1} 项" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-topic-down="${index}" aria-label="下移第 ${index + 1} 项" ${index === data.items.length - 1 ? "disabled" : ""}>↓</button><button type="button" data-topic-remove="${index}">移出</button></div></li>`;
      })
      .join("") ||
    '<li class="help">还没有内容，从下方选择文章、项目或工具。</li>'
  }</ol><div class="topic-picker"><h3>添加内容</h3><div class="topic-picker-filters"><label class="field"><span>内容类型</span><select id="topic-kind"><option value="">全部</option><option value="articles">文章</option><option value="projects">项目</option><option value="tools">工具</option></select></label><label class="field"><span>搜索</span><input id="topic-search" type="search" placeholder="搜索名称或标题"></label></div><div id="topic-candidates" aria-live="polite"></div></div></section>`;
}
function topicCandidates() {
  const query = ($("#topic-search")?.value ?? "").trim().toLowerCase();
  const kindFilter = $("#topic-kind")?.value;
  const selected = new Set(
    editing.data.items.map((ref) => ref.kind + ":" + ref.id),
  );
  const choices = ["articles", "projects", "tools"].flatMap((kind) =>
    snapshot.state[kind]
      .filter(
        (record) =>
          !record.archived &&
          (!kindFilter || kind === kindFilter) &&
          !selected.has(kind + ":" + record.id) &&
          (record.data.title ?? record.data.name).toLowerCase().includes(query),
      )
      .map((record) => ({ kind, record })),
  );
  $("#topic-candidates").innerHTML =
    choices
      .map(
        ({ kind, record }) =>
          `<div class="topic-candidate"><div><small>${names[kind]}${kind !== "articles" && !record.included ? " · 尚未发布" : ""}</small><strong>${escape(record.data.title ?? record.data.name)}</strong></div><button type="button" data-topic-add="${kind}:${record.id}" aria-label="添加${escape(record.data.title ?? record.data.name)}">添加</button></div>`,
      )
      .join("") || '<p class="help">没有匹配的可添加内容。</p>';
}
function toolFields(data) {
  const section = (number, title, description, content) =>
    `<section class="project-form-section"><div class="project-section-heading"><span>${number}</span><div><h2>${title}</h2><p>${description}</p></div></div>${content}</section>`;
  const render = (keys, source = data, prefix = "") =>
    keys.map((key) => field(source[key], key, prefix)).join("");
  return (
    section(
      "01",
      "基本信息",
      "填写工具名称、类型与图标缩写。",
      `<div class="project-form-grid tool-basic-fields">${field(data.name, "name", "")}<label class="field" for="record-id"><span>内容标识</span><input id="record-id" value="${escape(editing.id)}" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100" required ${editing.isNew ? "" : "readonly"}></label>${render(["kind", "monogram"])}</div>`,
    ) +
    section(
      "02",
      "工具介绍",
      "介绍用途、主要功能，并添加展示截图。",
      `<div class="project-form-grid tool-content-fields">${render(["summary", "description", "features", "screenshots"])}</div>`,
    ) +
    section(
      "03",
      "版本与下载",
      "直接上传安装包，网站自动生成下载路径、文件大小和校验值。",
      `<div class="tool-package-picker"><label class="field" for="tool-package-upload"><span>${data.release.downloadUrl ? "替换安装包" : "上传安装包"}</span><input id="tool-package-upload" type="file" accept=".dmg,.zip,.tar.gz,.tgz,.vsix"><small>支持 DMG、ZIP、tar.gz、TGZ、VSIX，最多 256 MB。保存并发布后，访客即可下载。</small></label>${data.release.downloadUrl ? `<p class="help">已配置安装包 · ${escape(data.release.packageFormat)} · ${escape(data.release.fileSize)}</p>` : ""}</div><div class="project-form-grid tool-release-fields">${render(["version", "packageFormat", "fileSize", "releasedAt"], data.release, "release")}</div>`,
    )
  );
}
function projectUrlList(data, key, label) {
  return `<section class="project-url-list" aria-labelledby="${key}-heading"><div class="project-url-heading"><h3 id="${key}-heading">${label}</h3><button type="button" data-add="${key}">＋ 添加链接</button></div><div class="project-url-rows">${data[key].map((url, i) => `<div class="project-url-row"><label class="field" for="${key}-${i}"><input id="${key}-${i}" name="${key}.${i}" value="${escape(url)}" type="url" placeholder="https://" required aria-label="${label} ${i + 1}"></label><button type="button" data-remove="${key}.${i}" aria-label="移除${label} ${i + 1}">移除</button></div>`).join("") || '<p class="help">尚未添加链接</p>'}</div></section>`;
}
function set(obj, path, value) {
  const keys = path.split(".");
  let at = obj;
  for (const k of keys.slice(0, -1)) at = at[k];
  at[keys.at(-1)] = value;
}
function get(obj, path) {
  return path.split(".").reduce((a, k) => a[k], obj);
}
function collect(form, base) {
  const data = structuredClone(base);
  form.querySelectorAll("[name]").forEach((el) => {
    if (el.name.startsWith("_") || el.dataset.type === "multi-check") return;
    set(
      data,
      el.name,
      el.type === "checkbox"
        ? el.checked
        : el.type === "number"
          ? Number(el.value)
          : el.dataset.type === "lines"
            ? el.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : el.multiple
              ? [...el.selectedOptions].map((o) => o.value)
              : el.value,
    );
  });
  for (const name of new Set(
    [...form.querySelectorAll('[data-type="multi-check"]')].map(
      (el) => el.name,
    ),
  ))
    set(
      data,
      name,
      [
        ...form.querySelectorAll(
          `[data-type="multi-check"][name="${name}"]:checked`,
        ),
      ].map((el) => el.value),
    );
  return data;
}
function capture() {
  if (!editing) return;
  syncRichBody();
  editing.data = collect(
    $("#editor"),
    page === "articles" ? articleData(editing.data) : editing.data,
  );
  editing.body = $("#body")?.value ?? "";
  if (page === "articles") {
    editing.included = true;
    editing.archived = false;
  } else {
    if ($("#included")) editing.included = $("#included").checked;
    editing.archived = false;
  }
  if ($("#record-id")) {
    editing.id = $("#record-id").value;
    if ("slug" in editing.data) editing.data.slug = editing.id;
  }
}
function editor() {
  if (richEditor) {
    richEditor.destroy();
    richEditor = null;
  }
  if (richImageHandler) {
    $("#body-editor")?.removeEventListener("dblclick", richImageHandler);
    richImageHandler = null;
  }
  richResizeObserver?.disconnect();
  richResizeObserver = null;
  // 重绘会换掉整批 img 元素，旧的测量记录没有意义。
  richMeasured = new WeakSet();
  const markdown = page === "articles";
  const isArticle = page === "articles";
  const isProject = page === "projects";
  const isTool = page === "tools";
  const isSkill = page === "skills";
  const isKnowledge = page === "knowledge";
  const editorData = isArticle ? articleData(editing.data) : editing.data;
  const statusFields =
    isArticle || isProject || isTool || isKnowledge || isSkill
      ? ""
      : `<div class="editor-status"><label class="check"><input id="included" type="checkbox" ${editing.included ? "checked" : ""}> 发布到访客站点</label></div>`;
  const editorFields = isArticle
    ? `<div class="article-fields">${articleFields(editorData)}</div>`
    : isProject
      ? `<div class="project-form">${projectFields(editorData)}</div>`
      : isTool
        ? `<div class="tool-form">${toolFields(editorData)}</div>`
        : isSkill
          ? skillFields(editorData)
        : isKnowledge
          ? `<div class="knowledge-form">${knowledgeFields(editorData)}</div>`
          : `<div class="fields"><label class="field">内容标识<input id="record-id" value="${escape(editing.id)}" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100" required ${editing.isNew ? "" : "readonly"} aria-describedby="id-help"><small id="id-help">英文小写与短横线，发布后用于页面地址。</small></label>${fields(editorData)}</div>`;
  $("#content").innerHTML =
    `<form id="editor" class="${isArticle ? "article-editor" : isProject ? "project-editor" : isTool ? "tool-editor" : isKnowledge ? "knowledge-editor" : isSkill ? "skill-editor" : ""}">${isSkill ? `${statusFields}${editorFields}` : `<div class="card ${isArticle ? "article-meta-card" : "editor-meta-card"} ${isProject ? "project-editor-card" : ""}">${statusFields}${editorFields}</div>`}${
      markdown
        ? `<div class="card article-writing-card"><div class="editor-mode-tabs" role="tablist" aria-label="编辑模式"><button type="button" class="active" data-editor-mode="wysiwyg" role="tab" aria-selected="true">正文</button><button type="button" data-editor-mode="markdown" role="tab" aria-selected="false">Markdown</button><button type="button" data-editor-mode="preview" role="tab" aria-selected="false">预览</button></div><div id="body-editor" class="toast-editor-host" aria-label="正文编辑区"></div><textarea id="body" class="markdown-source" aria-hidden="true">${escape(editing.body)}</textarea><small>支持标题、加粗、斜体、列表、引用、代码块、表格和图片。可直接粘贴图片。</small><div id="markdown-preview" class="body-preview" hidden></div></div><section class="card source-import"><h3>导入原文件</h3><p class="help">上传后会替换当前正文，支持 MD、Markdown、HTML、JPG、JPEG、PNG 和 WebP。</p><label class="field"><span>选择文件</span><input type="file" id="editor-upload" accept=".html,.htm,.md,.markdown,.png,.jpg,.jpeg,.webp"></label></section>`
        : ""
    }<div class="editor-actions"><button type="button" data-action="back">返回列表</button><div class="editor-action-buttons"><button type="submit" data-save-mode="draft">保存草稿</button><button type="submit" class="primary" data-save-mode="publish">保存并发布</button></div></div></form>`;
  if (isKnowledge) topicCandidates();
  if (isArticle) void initRichEditor(editing.body);
}
function newRecord() {
  const date = new Date().toISOString().slice(0, 10);
  const common = {
    title: "",
    summary: "",
  };
  const data = {
    skills: { slug:'', name:'', summary:'', category:'development', origin:'original', sourceUrl:'', monogram:'SK', version:'', documentation:'', featured:false, order:0, demo:false, fileUrl:'', fileName:'', fileSize:0, checksum:'' },
    articles: {
      ...common,
      publishedAt: date,
      tags: [],
      readingMinutes: 5,
      draft: false,
    },
    knowledge: { ...common, order: 0, items: [] },
    projects: {
      slug: "",
      name: "",
      type: "Application",
      status: "building",
      demo: false,
      tagline: "",
      summary: "",
      stack: [],
      capabilities: [],
      evidence: [],
      documentation: "",
      repositoryUrl: "",
      documentationUrl: "",
      related: [],
    },
    tools: {
      slug: "",
      name: "",
      monogram: "IB",
      kind: "macos-app",
      platform: "macOS",
      availability: "demo",
      summary: "",
      description: "",
      features: [],
      screenshots: [],
      relatedProject: "",
      release: {
        version: "0.1.0",
        packageFormat: "DMG",
        fileSize: "待上传",
        requirements: "macOS 13+",
        releasedAt: date,
        checksum: "",
        notes: [],
        downloadUrl: "",
      },
    },
  }[page];
  return {
    id: ["articles", "knowledge"].includes(page)
      ? `${page === "knowledge" ? "topic" : "article"}-${date.replaceAll("-", "")}-${randomHex(8)}`
      : page === "skills"
        ? `skill-${randomHex(12)}`
      : "",
    data,
    body: "",
    included: page === "articles",
    archived: false,
    isNew: true,
  };
}
function tagRow(tag, isNew = false) {
  const count = snapshot.state.articles.filter((article) =>
    article.data.tags.includes(tag.slug),
  ).length;
  return `<div class="tag-manage-row" data-tag-row><div class="tag-input-cell"><input aria-label="标签标识" data-tag-slug value="${escape(tag.slug)}" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100" required ${isNew ? "" : "readonly"}>${isNew ? "<small>英文小写与短横线，创建后不可修改。</small>" : ""}</div><div class="tag-input-cell"><input aria-label="标签名称" data-tag-label value="${escape(tag.label)}" maxlength="240" required></div><span class="tag-usage">${count ? `${count} 篇文章使用` : "尚未使用"}</span><button type="button" data-tag-remove ${count ? "disabled" : ""} title="${count ? "请先从相关文章中移除这个标签" : "移除标签"}">移除</button></div>`;
}
function tagManager() {
  $("#content").innerHTML =
    `<form id="tags-form" class="tag-manager"><section class="card"><div class="section-heading"><div><h2>文章标签</h2><p class="help">标签用于组织文章并生成公开标签页。标识使用英文小写与短横线，创建后不可修改。</p></div><button type="button" data-action="add-tag">新增标签</button></div><div class="tag-table"><div class="tag-table-head" aria-hidden="true"><span>标识</span><span>名称</span><span>使用情况</span><span>操作</span></div><div class="tag-manage-list">${snapshot.state.tags.map((tag) => tagRow(tag)).join("") || '<p class="empty">还没有标签。</p>'}</div></div></section><div class="editor-actions"><span class="help">正在使用的标签需先从相关文章中移除。</span><div class="editor-action-buttons"><button type="submit" data-save-mode="draft">保存草稿</button><button type="submit" class="primary" data-save-mode="publish">保存并发布</button></div></div></form>`;
}
function media() {
  $("#content").innerHTML =
    `<section class="card"><h2>文件留在草稿，引用后随站点发布。</h2><p class="help">支持 HTML / Markdown / PNG / JPEG / WebP / PDF / DMG / ZIP / tar.gz / VSIX。HTML 与 Markdown 最多 2 MB，其他文件最多 256 MB；文档预览会清理脚本等危险内容。</p><form id="upload" class="toolbar"><label class="field">上传文件<input type="file" id="file" required accept=".html,.htm,.md,.markdown,.png,.jpg,.jpeg,.webp,.pdf,.dmg,.zip,.tar.gz,.tgz,.vsix"></label><button class="primary">上传到文件库</button></form></section><div class="asset-grid">${assets.map((a) => `<article class="card asset">${a.type.startsWith("image/") ? `<img src="/admin/api/assets/${a.filename}" alt="${escape(a.name)}">` : a.type.startsWith("text/") ? `<iframe class="asset-preview" src="/admin/api/assets/${a.filename}/preview" title="${escape(a.name)}预览" sandbox loading="lazy"></iframe>` : ""}<h2>${escape(a.name)}</h2><p class="help">${(a.size / 1024 / 1024).toFixed(2)} MB · ${escape(a.type)}</p><code>${escape(a.url)}</code><div class="asset-actions"><button data-copy="${a.url}">复制引用地址</button><button class="asset-delete" data-asset-delete="${a.filename}">删除</button></div><details><summary>SHA-256</summary><p><code>${a.sha256}</code></p></details></article>`).join("") || '<p class="empty">文件库还是空的。</p>'}</div>`;
}

async function uploadAsset(file) {
  const data = new FormData();
  data.append("file", file);
  const asset = await api("assets", "POST", data);
  assets = await api("assets");
  return asset;
}

async function renderBodyPreview(
  source = "#body",
  target = "#markdown-preview",
) {
  const result = await api("markdown", "POST", { body: $(source).value });
  const preview = $(target);
  preview.hidden = false;
  for (const url of previewObjectUrls) URL.revokeObjectURL(url);
  previewObjectUrls = [];
  preview.innerHTML = result.html || '<p class="empty">正文为空。</p>';
  if (window.renderDiagrams) await window.renderDiagrams(preview);
  await Promise.all(
    [...preview.querySelectorAll('img[src^="/admin/api/assets/"]')].map(
      async (image) => {
        const response = await fetch(image.getAttribute("src"), {
          credentials: "include",
        });
        if (!response.ok)
          throw new Error(`正文图片读取失败（${response.status}）`);
        const objectUrl = URL.createObjectURL(await response.blob());
        previewObjectUrls.push(objectUrl);
        image.src = objectUrl;
      },
    ),
  );
}

function syncRichBody() {
  const source = $("#body");
  if (richEditor && source && !richHydrating)
    source.value = richEditor
      .getMarkdown()
      .replaceAll("/admin/api/assets/", "/media/");
}

function editorMarkdown(source) {
  return source.replaceAll("/media/", "/admin/api/assets/");
}

async function initRichEditor(source = "") {
  const host = $("#body-editor");
  if (!host || !window.toastui?.Editor) return;
  richHydrating = true;
  richSettled = false;
  try {
    window.toastui.Editor.setLanguage("zh-CN", {
      Headings: "标题",
      Heading: "H",
      Paragraph: "正文",
      "Text color": "文字颜色",
      "Background color": "背景颜色",
    });
    richEditor = new window.toastui.Editor({
      el: host,
      height: "460px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      hideModeSwitch: true,
      initialValue: editorMarkdown(source),
      usageStatistics: false,
      plugins: [],
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote", "ul", "ol"],
        ["table", "image", "code", "codeblock"],
      ],
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          try {
            const asset = await uploadAsset(blob);
            callback(`/admin/api/assets/${encodeURIComponent(asset.filename)}`, blob.name || "图片");
            dirty = true;
          } catch (error) {
            notify(error.message, true);
          }
        },
      },
    });
    richEditor.on("change", () => {
      syncRichBody();
      dirty = true;
    });
    richImageHandler = (event) => {
      const image = event.target.closest?.("img");
      if (!image || !host.contains(image)) return;
      const currentWidth = image.width || image.naturalWidth || "";
      const currentHeight = image.height || image.naturalHeight || "";
      const width = prompt("图片宽度（像素，留空使用原始宽度）", currentWidth);
      if (width === null) return;
      const height = prompt("图片高度（像素，留空自动按比例）", currentHeight);
      if (height === null) return;
      const markdown = richEditor
        .getMarkdown()
        .replaceAll("/admin/api/assets/", "/media/");
      const src = image.getAttribute("src")?.replace("/admin/api/assets/", "/media/");
      if (!src) return;
      const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedSrc}\\)`);
      const attrs = [`src="${src}"`, `alt="${escape(image.alt || "图片")}"`];
      const styles = [];
      if (/^\\d+$/.test(width.trim())) {
        attrs.push(`width="${width.trim()}"`);
        styles.push(`width:${width.trim()}px`);
      }
      if (/^\\d+$/.test(height.trim())) {
        attrs.push(`height="${height.trim()}"`);
        styles.push(`height:${height.trim()}px`);
      }
      if (styles.length) attrs.push(`style="${styles.join(";")}"`);
      const replacement = `<img ${attrs.join(" ")}>`;
      const nextMarkdown = imagePattern.test(markdown)
        ? markdown.replace(imagePattern, replacement)
        : `${markdown}\n\n${replacement}`;
      richEditor.setMarkdown(editorMarkdown(nextMarkdown));
      dirty = true;
    };
    host.addEventListener("dblclick", richImageHandler);
    richResizeObserver = new ResizeObserver((entries) => {
      // ResizeObserver 在开始观察每张图片时就会回调一次，且回调是异步的，
      // 发生在 richHydrating 复位之后。这一次只是记录初始宽度，不是作者的修改；
      // 否则打开带图文章、或保存后重绘编辑器，都会立刻被标成「未保存」。
      let resized = false;
      for (const { target } of entries) {
        if (target.tagName !== "IMG" || !target.clientWidth) continue;
        const width = String(Math.round(target.clientWidth));
        const first = !richMeasured.has(target);
        richMeasured.add(target);
        if (target.getAttribute("width") === width) continue;
        target.setAttribute("width", width);
        if (!first) resized = true;
      }
      if (!resized) return;
      syncRichBody();
      dirty = true;
    });
    host.querySelectorAll("img").forEach((image) => richResizeObserver.observe(image));
    host.addEventListener("load", (event) => {
      if (event.target?.tagName === "IMG") richResizeObserver.observe(event.target);
    }, true);
  } finally {
    richHydrating = false;
  }
}

async function setEditorMode(mode) {
  if (!richEditor) return;
  syncRichBody();
  const host = $("#body-editor");
  const preview = $("#markdown-preview");
  for (const button of document.querySelectorAll("[data-editor-mode]")) {
    const active = button.dataset.editorMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  }
  if (mode === "preview") {
    host.style.display = "none";
    await renderBodyPreview();
  } else {
    host.style.display = "";
    preview.hidden = true;
    richEditor.changeMode(mode);
  }
}

async function replaceBodyWithAsset(asset) {
  const body = $("#body");
  let source;
  if (asset.type.startsWith("image/")) {
    const alt = asset.name.replace(/[\[\]()]/g, " ").trim() || "图片描述";
    source = `![${alt}](${asset.url})`;
  } else {
    source = (await api(`assets/${asset.filename}/source`)).source;
  }
  body.value = source;
  if (richEditor) richEditor.setMarkdown(editorMarkdown(source));
  dirty = true;
  await renderBodyPreview();
  $("#markdown-preview").scrollIntoView({ block: "start" });
  notify(`${asset.name} 已作为整篇正文导入并展示。`);
}
async function publishCurrentState() {
  await api("build", "POST", {
    revision: snapshot.state.revision,
  });
  notify("正在发布，请保持页面打开…");
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const result = await api("build");
    snapshot.job = result.job;
    snapshot.active = result.active;
    if (result.job.status === "building") continue;
    if (result.job.status !== "succeeded")
      throw Error(result.job.message ?? "发布失败，访客站点保持不变");
    await refresh();
    return;
  }
}
function canLeave() {
  return !dirty || confirm("有尚未保存的修改，确定放弃吗？");
}
app.addEventListener("input", (e) => {
  if (e.target.id === "topic-search") {
    topicCandidates();
    return;
  }
  if (e.target.id === "f-name" && page === "skills") syncSkillId();
  if (e.target.id === "body-editor") syncRichBody();
  if (e.target.closest("#editor,#settings-form,#tags-form")) dirty = true;
});
for (const type of ["dragover", "dragleave", "drop"])
  app.addEventListener(type, async (e) => {
    const drop = e.target.closest?.(".skill-drop, .shot-pick");
    if (!drop) return;
    e.preventDefault();
    drop.classList.toggle("dragging", type === "dragover");
    if (type !== "drop") return;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const shot = drop.querySelector("[data-shot-upload]")?.dataset.shotUpload;
      if (shot) await receiveShot(shot, file);
      else await receiveSkillFile(file);
    } catch (error) {
      notify(error.message, true);
    }
  });
app.addEventListener("change", async (e) => {
  try {
    if (e.target.id === 'f-origin') { capture(); editor(); $('#f-origin')?.focus(); return; }
    if (e.target.id === 'skill-package-upload' && e.target.files?.[0]) {
      await receiveSkillFile(e.target.files[0]);
      return;
    }
    if (e.target.id === "topic-kind") {
      topicCandidates();
      return;
    }
    if (e.target.dataset.shotUpload && e.target.files?.[0]) {
      await receiveShot(e.target.dataset.shotUpload, e.target.files[0]);
      return;
    }
    if (e.target.id === "tool-package-upload" && e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!/\.(dmg|zip|tar\.gz|tgz|vsix)$/i.test(file.name))
        throw Error("请选择 DMG、ZIP、tar.gz、TGZ 或 VSIX 安装包");
      if (file.size > 256 * 1024 * 1024) throw Error("安装包不能超过 256 MB");
      capture();
      const controls = [
        ...app.querySelectorAll("button,input,select,textarea"),
      ];
      const disabledStates = controls.map((control) => control.disabled);
      controls.forEach((control) => {
        control.disabled = true;
      });
      notify("正在上传安装包，请保持页面打开…");
      try {
        const a = await uploadAsset(file);
        Object.assign(editing.data.release, {
          downloadUrl: a.url,
          checksum: a.sha256,
          fileSize: (a.size / 1024 / 1024).toFixed(2) + " MB",
          packageFormat: /\.tar\.gz$/i.test(a.name)
            ? "tar.gz"
            : a.name.split(".").at(-1).toUpperCase(),
        });
        dirty = true;
        editor();
        notify("安装包已上传，下载路径已生成。保存并发布后生效。");
      } finally {
        controls.forEach((control, index) => {
          control.disabled = disabledStates[index];
        });
        e.target.value = "";
      }
    }
    if (e.target.id === "editor-upload" && e.target.files?.[0]) {
      const body = $("#body");
      if (
        body.value.trim() &&
        !confirm("上传原文件会替换当前正文，确定继续吗？")
      ) {
        e.target.value = "";
        return;
      }
      e.target.disabled = true;
      notify("正在导入本地文件…");
      const asset = await uploadAsset(e.target.files[0]);
      await replaceBodyWithAsset(asset);
      e.target.value = "";
      e.target.disabled = false;
    }
  } catch (error) {
    e.target.disabled = false;
    notify(error.message, true);
  }
});
app.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  try {
    if (
      b.dataset.topicAdd ||
      b.dataset.topicRemove !== undefined ||
      b.dataset.topicUp !== undefined ||
      b.dataset.topicDown !== undefined
    ) {
      capture();
      const items = editing.data.items;
      if (b.dataset.topicAdd) {
        const [kind, id] = b.dataset.topicAdd.split(":");
        if (!items.some((ref) => ref.kind === kind && ref.id === id))
          items.push({ kind, id });
      } else if (b.dataset.topicRemove !== undefined) {
        items.splice(Number(b.dataset.topicRemove), 1);
      } else {
        const index = Number(b.dataset.topicUp ?? b.dataset.topicDown);
        const target = index + (b.dataset.topicUp !== undefined ? -1 : 1);
        if (target >= 0 && target < items.length)
          [items[index], items[target]] = [items[target], items[index]];
      }
      dirty = true;
      editor();
    } else if (b.dataset.page) {
      if (!canLeave()) return;
      dirty = false;
      editing = null;
      page = b.dataset.page;
      rememberPage();
      await refresh();
      draw();
      window.scrollTo(0, 0);
    } else if (b.dataset.action === "theme") {
      applyTheme(theme === "dark" ? "light" : "dark");
      draw();
    } else if (b.dataset.action === "publish") {
      if (dirty && !confirm("当前页面有未保存修改，发布将使用最近一次保存的草稿。继续吗？")) return;
      b.disabled = true;
      await publishCurrentState();
      draw();
    } else if (b.dataset.action === "add-tag") {
      const list = $(".tag-manage-list");
      list.querySelector(".empty")?.remove();
      list.insertAdjacentHTML(
        "beforeend",
        tagRow({ slug: "", label: "" }, true),
      );
      dirty = true;
      list.lastElementChild.querySelector("[data-tag-slug]").focus();
    } else if (b.dataset.tagRemove !== undefined) {
      b.closest("[data-tag-row]").remove();
      dirty = true;
      if (!$("[data-tag-row]"))
        $(".tag-manage-list").innerHTML =
          '<p class="empty">还没有标签，点击“新增标签”创建。</p>';
    } else if (b.dataset.delete) {
      const record = snapshot.state[page].find(
        (r) => r.id === b.dataset.delete,
      );
      if (!record) throw Error("内容不存在，请刷新后重试");
      const title = record.data.title ?? record.data.name;
      if (!confirm(`确定删除「${title}」？删除后将同步更新访客站点。`)) return;
      b.disabled = true;
      notify("正在删除并更新访客站点…");
      try {
        const result = await api(`records/${page}/${record.id}`, "DELETE", {
          revision: snapshot.state.revision,
        });
        snapshot.state = result.state;
        snapshot.active = result.active;
        draw();
        notify(`已删除「${title}」，访客站点已更新`);
      } catch (error) {
        await refresh();
        draw();
        throw error;
      }
    } else if (b.dataset.edit) {
      skillReport = null;
      editing = structuredClone(
        snapshot.state[page].find((r) => r.id === b.dataset.edit),
      );
      if (page === "tools") editing.data.screenshots ??= [];
      if (page === "projects") {
        editing.data.repositoryUrl ??= "";
        editing.data.documentationUrl ??= "";
      }
      editor();
      window.scrollTo(0, 0);
    } else if (b.dataset.add) {
      capture();
      const key = b.dataset.add.split(".").at(-1);
      get(editing.data, b.dataset.add).push(structuredClone(templates[key]));
      dirty = true;
      editor();
    } else if (b.dataset.remove) {
      capture();
      const parts = b.dataset.remove.split(".");
      const index = Number(parts.pop());
      get(editing.data, parts.join(".")).splice(index, 1);
      dirty = true;
      editor();
    } else if (b.dataset.assetDelete) {
      const asset = assets.find(
        (entry) => entry.filename === b.dataset.assetDelete,
      );
      if (!asset) throw Error("文件不存在，请刷新后重试");
      if (!confirm(`确定删除「${asset.name}」？删除后无法从文件库恢复。`))
        return;
      b.disabled = true;
      const result = await api(`assets/${asset.filename}`, "DELETE", {});
      assets = result.assets;
      media();
      notify(`已删除「${asset.name}」`);
    } else if (b.dataset.copy) {
      await copyText(b.dataset.copy);
    } else if (b.dataset.action === "new") {
      skillReport = null;
      editing = newRecord();
      editor();
      window.scrollTo(0, 0);
      $(
        ["projects", "tools", "skills"].includes(page)
          ? "#f-name"
          : "#record-id, #f-title",
      )?.focus();
    } else if (b.dataset.action === "back") {
      if (!canLeave()) return;
      dirty = false;
      editing = null;
      draw();
      window.scrollTo(0, 0);
    } else if (b.dataset.action === "logout") {
      if (!canLeave()) return;
      await api("logout", "POST", {});
      dirty = false;
      location.reload();
    } else if (b.dataset.action === 'skill-preview') {
      await renderBodyPreview('#f-skill-documentation', '#skill-preview');
    } else if (b.dataset.action === "project-markdown") {
      await renderBodyPreview("#f-documentation", "#project-markdown-preview");
    } else if (b.dataset.editorMode) {
      await setEditorMode(b.dataset.editorMode);
    } else if (b.dataset.action === "markdown") {
      await renderBodyPreview();
    }
  } catch (e) {
    notify(e.message, true);
    b.disabled = false;
  }
});
app.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target,
    button = e.submitter ?? form.querySelector("button[type=submit]");
  const submitButtons = [
    ...form.querySelectorAll('button:not([type="button"])'),
  ];
  const publish = button?.dataset.saveMode === "publish";
  try {
    for (const submitButton of submitButtons) submitButton.disabled = true;
    if (form.id === "login") {
      const password = $("#password").value;
      if ($("#confirm") && $("#confirm").value !== password)
        throw Error("两次输入的密码不一致");
      const data = await api(form.dataset.mode, "POST", { password });
      csrf = data.csrf;
      await refresh();
      draw();
      notify("欢迎回来");
    } else if (form.id === "editor") {
      capture();
      const record = structuredClone(editing);
      if (page === "tools") {
        record.data.availability = record.data.release.downloadUrl?.trim()
          ? "available"
          : "demo";
        record.data.relatedProject = "";
        const previous = snapshot.state.tools.find(
          (tool) => tool.id === record.id,
        );
        if (!previous || previous.data.kind !== record.data.kind)
          record.data.platform =
            record.data.kind === "macos-app"
              ? "macOS"
              : record.data.kind === "web-tool"
                ? "浏览器"
                : "见系统要求";
      }
      if (["projects", "tools", "knowledge", "skills"].includes(page) && publish)
        record.included = true;
      delete record.isNew;
      const data = await api(`records/${page}/${record.id}`, "PUT", {
        revision: snapshot.state.revision,
        record,
      });
      snapshot.state = data.state;
      editing = structuredClone(
        data.state[page].find((r) => r.id === record.id),
      );
      if (publish) {
        await publishCurrentState();
        editing = structuredClone(
          snapshot.state[page].find((r) => r.id === record.id),
        );
      }
      editor();
      // 放在重绘之后：重建表单与富文本会触发 input 事件，先清标记会被重新置脏。
      dirty = false;
      notify(publish ? "保存并发布成功" : "草稿已保存");
    } else if (form.id === "settings-form") {
      const result = await api("settings", "PUT", {
        revision: snapshot.state.revision,
        settings: collect(form, snapshot.state.settings),
      });
      snapshot.state = result.state;
      if (publish) await publishCurrentState();
      draw();
      dirty = false;
      notify(publish ? "设置已保存并发布" : "设置草稿已保存");
    } else if (form.id === "tags-form") {
      const tags = [...form.querySelectorAll("[data-tag-row]")].map((row) => ({
        slug: row.querySelector("[data-tag-slug]").value.trim(),
        label: row.querySelector("[data-tag-label]").value.trim(),
      }));
      const result = await api("tags", "PUT", {
        revision: snapshot.state.revision,
        tags,
      });
      snapshot.state = result.state;
      snapshot.catalogs.tags = result.state.tags.map(({ slug, label }) => [
        slug,
        label,
      ]);
      if (publish) await publishCurrentState();
      tagManager();
      dirty = false;
      notify(publish ? "标签已保存并发布" : "标签草稿已保存");
    } else if (form.id === "upload") {
      notify("正在上传，请保持页面打开…");
      await uploadAsset($("#file").files[0]);
      media();
      notify("上传完成。可在内容中引用，或在工具编辑页选择安装包。");
    }
  } catch (error) {
    notify(error.message, true);
    form.setAttribute("aria-describedby", "notice");
  } finally {
    for (const submitButton of submitButtons) submitButton.disabled = false;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
async function init() {
  try {
    const session = await api("session");
    csrf = session.csrf ?? "";
    if (session.authenticated) {
      page = pageFromLocation();
      await refresh();
      draw();
      return;
    }
    app.innerHTML = `<main id="main" class="login"><div class="brand">InkBrain.</div><div class="eyebrow">AUTHOR WORKSPACE</div><h1>${session.configured ? "继续你的创作" : "创建作者密码"}</h1><p class="muted">${session.configured ? "登录管理文章、项目与工具。" : "这是你的私人工作台。请设置至少 6 位的密码，没有默认密码。"}</p><form id="login" data-mode="${session.configured ? "login" : "setup"}"><label class="field">密码<input id="password" type="password" required minlength="6" maxlength="256" autocomplete="${session.configured ? "current-password" : "new-password"}"></label>${session.configured ? "" : '<label class="field">确认密码<input id="confirm" type="password" required minlength="6" autocomplete="new-password"></label>'}<button class="primary">${session.configured ? "登录" : "创建并进入工作台"}</button></form></main>`;
  } catch (e) {
    notify(e.message, true);
  }
}
init();
