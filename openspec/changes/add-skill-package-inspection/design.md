## Context

`add-skill-workbench` 的 Non-Goals 含「不自动解包」，压缩包按不可信附件只存字节。实际使用后 `documentation` 长期为空，访客拿不到任何说明。本变更收窄那条 Non-Goal：仍不解包落盘，但允许在内存中读取包内的元数据文件。

参考实现来自 `s-platform-resource-hub`：`SKILL.md` 位于压缩包根或唯一包装目录下一层，元信息另有 `skill.manifest.json` / `.skill-meta.json`。本仓库已上传的包符合该形状。

## Goals / Non-Goals

Goals: 上传后自动得到 `SKILL.md` 正文与 name/description/version；压缩包读取有显式安全上限；作者对回填结果保有最终编辑权。

Non-Goals: 解包落盘、包内文件浏览或预览、执行包内脚本、把包内其他文件写进发布快照、自动保存或自动发布、扫描本地 Skill 目录。

## Decisions

- 解析入口为 `POST /admin/api/skill-inspect`，请求体为已存附件的 `filename`，仅返回解析结果，不写入草稿。前端先沿用 `uploadAsset` 存附件，再请求解析并回填表单字段，`dirty` 置位等待作者保存。附件只上传一次。
- Markdown 上传（`.md` / `.markdown`）路径不变，继续直接作为附件；本变更只针对压缩包。
- zip 读取使用 Node 内置 `node:zlib` 的 `inflateRawSync` 解析中央目录，不新增依赖。只解压被选中的元数据条目，其余条目仅读头部。
- 条目筛选顺序：先按原始路径文本拒绝 `..` / 绝对路径 / 反斜杠 / 空段 / 首尾空白，再做 POSIX 归一化；拒绝符号链接条目（`external_attr >> 16` 的类型位）；跳过 `__MACOSX`、`.DS_Store`、`._*`。
- 包装目录由 `SKILL.md` 的深度推断：位于深度 1 时其首段即包装目录，统一剥离该前缀，前缀外条目忽略。缺少 `SKILL.md` 时返回可读错误，附件保留。
- 安全上限：条目数 ≤ 2000，单条解压 ≤ 4 MB，解压总量 ≤ 16 MB，单条压缩比 ≤ 200:1。上限先按中央目录声明值校验，再在实际解压时按累计字节二次校验，因为声明值由上传者控制。
- 解析对象大小上限 64 MB，在解析接口内校验。全局上传上限保持 256 MB 不变，因为 `.zip` 同时用于工具安装包；超过 64 MB 的 Skill 压缩包仍可作为附件下载，只是不解析。
- frontmatter 用锚定正则 `/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/` 提取，不用按 `---` 切分，避免值内含 `---` 时错切。YAML 解析失败时保留正文并提示，不整体失败。
- 回填策略：`documentation` 为空时写入 `SKILL.md` 去掉 frontmatter 的正文；`name` / `summary` / `version` 同样只在当前为空时填充，已有内容不覆盖。正文原样保存，渲染沿用现有 `sanitize-html` 清洗。

## Risks / Trade-offs

- 恶意压缩包 → 不落盘、不执行，两遍尺寸校验加压缩比上限，路径与符号链接校验在归一化前完成；解析接口要求认证与 CSRF。
- 单条 4 MB 上限可能截断超长 `SKILL.md` → 超限时报错并保留附件，作者仍可手工填写。
- 回填不覆盖已有字段 → 重新上传不会刷新旧说明，作者需自行清空后重传。选择保守方向避免覆盖手工编辑。

## Migration Plan

部署代码并重启后台。已上传但说明为空的 Skill 需重新上传压缩包以触发解析，或手工填写。不改动既有记录、附件与发布指针。
