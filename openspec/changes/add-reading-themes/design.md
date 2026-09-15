## Context

Astro 静态游客页共用 BaseLayout 与 SiteHeader，现有 data-theme 和 inkbrain-theme 负责日夜。文章已统一正文列与右侧目录，不能复制内容或破坏目录和图表交互。

## Goals / Non-Goals

**Goals:** 双风格、单图标、独立明暗、刷新和导航保持选择、移动端可读。

**Non-Goals:** 后台换肤、账号偏好同步、内容编辑、自动发布。

## Decisions

- 使用 data-style=paper/workbench 与 inkbrain-style 独立状态，不复用日夜键。默认纸上，不迁移已有日夜偏好。
- 首屏内联脚本读存储，try/catch 防止禁用存储阻断渲染；控件同样容错。
- 全站工作台基础令牌：底色 #f3f5f5、面板 #ffffff、正文 #202b30、辅助 #68767c、细线 #dee5e6、强调 #23645c；深色使用 #151c21/#1c252b/#e1e7eb 与 #8fcebd。
- 复用 IBM Plex Sans 与系统中文无衬线作工作台正文及标题，IBM Plex Mono 作代码；纸上维持 Noto Serif SC 与原有令牌。
- 工作台的特征是灰色桌面上的连续白色文档面板，右侧目录不再加卡片。正文最大约 900px、16px/1.85，标题 32px；手机缩小内边距保留正文宽度。
- 不新增模板或 UI 库。原生 button 提供键盘触发，图标仅表达切换，title 和 aria-label 明确当前及目标风格。

## Risks / Trade-offs

- 全局 CSS 覆盖 → 所有新增视觉规则均限定 data-style=workbench，不改变默认样式。
- 静态发布不自动更新 → 构建并验证隔离预览，不擅自发布用户草稿。
- 浏览器存储受限 → 本页仍可切换，刷新回退默认风格。
