## Context

现有作者后台以 revisioned JSON 保存草稿，附件先私有保存，经发布快照复制到静态站点。复用该机制，不增加独立服务。

## Goals / Non-Goals

Goals: 手动上传、来源归属、引用原链强制校验；忠实 B 图的页头、左分类和右横向能力条目；详情可读并下载。

Non-Goals: 本地自动发现、执行或安装 Skill、自动解包、批量抓取第三方、修改线上 active 指针。

## Decisions

- 独立 skills 集合。字段：slug/name/summary/category/origin/sourceUrl/monogram/version/documentation/featured/order/demo，以及上传生成的 fileUrl/fileName/fileSize/checksum。
- origin=original/reference，对外显示自研/引用。引用必须有无凭据 HTTPS 原始链接；UI 同步 required，后端强制验证。
- 支持 .md/.markdown/.zip/.skill。MD 沿用 UTF-8 与 2 MB 限制；压缩包沿用 256 MB 限制，只作为不可信附件储存。发布必须有文件，检查扩展名、来源、文件与 SHA-256 一致。
- 草稿可未上传；included 的记录发布前必须有附件。页面只接收 publishedRecords，发布快照包含 skills 和对应附件。旧状态在读写时补 skills=[]，不重写其他字段或自动导入。
- B 视觉：现有 paper/ink/accent 变量、display/sans/mono 字体；约 230px 左分类栏与弹性右能力列表，竖分隔线、朱砂选中分类、小图标、来源徽标和查看入口。顶部紧凑大标题，右侧小字。推荐与全部分组不重复条目，计数来自实际数据。
- Demo 只取本地 fixing-accessibility 单文件作为静态引用示例，标注来源，不声称用户自研。既有后台仍为空；隔离预览可展示 Demo。
- 详情统一展示来源、版本、大小、SHA-256、Markdown说明与下载。链接安全、正文清洗，不执行上传指令。

## Risks / Trade-offs

- 恶意附件 → 不解包、不执行，强制附件下载与 nosniff，上传仍需认证/CSRF。
- 旧后台进程 → Node 服务重启后加载新增 schema；不擅自重启用户运行服务。
- 数据不足 → 显示真实空状态，不生成假的计数、验证状态或填充卡片。

## Migration Plan

部署代码、重启后台、手动新增 Skill 后发布。旧数据 skills 缺失按空数组兼容；不改旧内容。失败发布保持上一版本。
