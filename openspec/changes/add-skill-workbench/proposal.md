## Why

用户选定 B「Skill 工作台」，并要求内容通过后台手动上传与管理，来源标记为自研或引用，不扫描本地 Skill 目录。

## What Changes

- 新增 Skill 导航、分类列表、详情与文件下载。
- 后台新增 Skill CRUD、手动上传、来源链接校验、保存草稿和发布。
- 复用私人附件、发布快照与校验和检查；压缩包不解压执行。
- 一个明确标注的引用 Demo 用于预览；已有后台只补空列表，不自动导入。

## Capabilities

### New Capabilities
- `skill-workbench`: 作者管理和发布 Skill，游客分类浏览、查看来源与下载。

### Modified Capabilities
无。

## Impact

影响后台 schema/store/publisher/表单、静态数据与 Skill 路由。保留其他内容和发布指针。不安装或执行上传 Skill，不做本地扫描或自动同步。
