## Why

文章首页现有头部和单篇条目占用空间过大，不利于发现内容。用户选择 B 编辑选读方向，并明确不使用分类展区，避免与专题首页混淆。

## What Changes

- 简洁刊头、一篇最新选读、其余文章按日期倒序双列展示。
- 浏览器本地搜索标题、摘要，含结果数、空结果和清除操作。
- 沿用纸上与阅读工作台、日夜模式，手机改为单列。
- 不修改专题、项目、文章详情和后台，不引入手动选读管理。

## Capabilities

### New Capabilities
- `writing-home-discovery`: 编辑式文章首页和本地搜索。

### Modified Capabilities
无。

## Impact

仅修改 writing/index.astro，新增独立组件、样式、搜索脚本与测试。保留 ArticleRow 供其他页面使用；无内容 schema 或发布流程变更。
