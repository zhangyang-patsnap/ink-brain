## 1. 压缩包读取

- [x] 1.1 新增 `apps/admin/skill-package.mjs`：zip 中央目录解析、路径与符号链接校验、macOS 垢过滤、两遍尺寸校验、包装目录剥离。
- [x] 1.2 提取 `SKILL.md` 正文与 frontmatter，读取 `skill.manifest.json` / `.skill-meta.json`，归一化为解析结果。

## 2. 后台接口与表单

- [x] 2.1 新增 `POST /admin/api/skill-inspect`，按已存附件文件名解析，沿用认证与 CSRF，解析对象上限 64 MB。
- [x] 2.2 上传压缩包后调用解析并回填空字段，展示解析摘要，保留作者已填内容。

## 3. 验证

- [x] 3.1 为压缩包读取与接口补测试：正常包、带包装目录、缺 `SKILL.md`、路径穿越、符号链接、超限、压缩比炸弹。
- [x] 3.2 运行 admin 与 web 测试、`npm run check`、`npm run build`、OpenSpec 严格校验，并在隔离后台实测上传回填。

验证：admin 测试 26/26、web 测试 19/19；Astro check 64 files 无错误；构建通过；OpenSpec 严格校验通过。隔离后台完成真实压缩包的上传、解析、回填、保存、发布与下载全链路。未修改线上已发布内容。
