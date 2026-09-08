# 内容维护

## 技术写作

文章位于 `src/content/articles/`。每篇可以指定多个 `tags`，目录定义在 `src/data/taxonomy.ts`，构建会自动生成标签页。示例正文发布前应替换为真实内容。

## 知识专题

专题位于 `src/content/knowledge/`。`thesis` 是核心判断，`concepts` 是概念，`learningPath` 是阅读顺序。`references` 分别引用文章 ID、Lab slug、项目 slug、工具 slug 和相邻专题 ID。每个专题自动拥有详情页。

## 自研项目

在 `src/data/projects.ts` 中维护正式项目主档。Atlas Agent Framework 是可替换的 Demo 名称。项目的研发文章、研究实验与可下载工具分别放入对应栏目，通过链接关联。当前源码和文档按钮为 Demo 占位。

## 工具市场

在 `src/data/tools.ts` 中维护软件与发行信息，支持 macOS App、CLI、插件和在线工具。

- `screenshots` 可配置本地图片路径与替代文字。
- `release` 包含版本、包格式、大小、系统要求、发布日期、更新说明与 SHA-256。
- 真实下载需设置 `availability: 'available'`、HTTPS `downloadUrl` 和 64 位十六进制 `checksum`。
- 安装包可托管于正式发布服务或对象存储；页面直接链接发行文件。
- Demo 大小、版本和日期也是示例，请与实际包一起替换。

## 本地检查

在仓库根目录执行 `npm run check` 和 `npm run build`。内容模式大幅变化后若开发服务器仍使用旧缓存，可停止服务器并重建 Astro 的生成缓存；不要通过给必填字段补空值掩盖内容错误。
