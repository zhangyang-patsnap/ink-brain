## Why

后台上传 Skill 压缩包后详情页只显示文件名和大小。包内的 `SKILL.md` 有完整说明，但 `add-skill-workbench` 把压缩包定为完全不解包的附件，说明必须手工重抄，实际结果是作者留空、访客看不到任何内容。

## What Changes

- 上传 `.zip` / `.skill` 时在内存中只读取 `SKILL.md` 与可选的 `skill.manifest.json` / `.skill-meta.json`，解析 YAML frontmatter。
- 解析结果回填到后台表单的名称、简介、版本与详细说明，作者可继续编辑，不自动保存也不自动发布。
- 压缩包仍作为不可执行附件原样存储和下载；包内其他文件不落盘、不进入发布快照。
- 为读取包内条目补充压缩包安全边界：条目数、单条解压大小、解压总量、压缩比、路径与符号链接校验。

## Capabilities

### Modified Capabilities
- `skill-workbench`: 上传压缩包后可自动获得 `SKILL.md` 说明，不再要求手工重抄；解包读取限定在元数据文件且受显式安全上限约束。

## Impact

影响后台上传流程与 Skill 表单（`apps/admin`），新增一个仅用于解析的接口。不改 Skill 数据结构、发布快照结构、访客页面与其他栏目。压缩包不落盘解包、不执行其中任何内容。
