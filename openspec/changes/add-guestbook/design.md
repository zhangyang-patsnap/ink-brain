## Context

网站为 Astro 静态页面，Express 提供后台和公开 API，作者认证为内存 Session + CSRF。

## Goals / Non-Goals

Goals: 独立站点留言入口、匿名提交、审核后展示、移动端和明暗主题适配。
Non-Goals: 文章留言、访客账号、邮件通知、富文本、附件、多实例部署。

## Decisions

- 使用 `/guestbook/` 页面和 `/api/guestbook` 公开接口；管理接口 `/admin/api/guestbook` 复用现有鉴权中间件。默认待审核，客户端无法指定状态。
- SQLite 位于 ADMIN_DATA_DIR/guestbook.sqlite，使用 Node 内置 node:sqlite，无额外服务。相比全量 JSON 改写，事务及索引更适合并发提交和分页。每次操作短连接，避免泄漏应用测试连接。
- 数据字段：递增 id、nickname、body、status（pending/approved/rejected）、createdAt、reviewedAt。公开字段白名单，不保存邮箱或原始 IP。
- 纯文本输出。昵称 1–40 字符，正文 1–2000 字符，8 KB 请求体；同源 JSON 提交。按可信 IP 每 15 分钟 5 条、全局每 15 分钟 100 条，在有界内存中限流；不把 IP 当身份。
- 列表按 id 倒序，游标分页，每页 20 条。后台按状态筛选，可通过、拒绝、撤回至待审核。提交和审核不重建页面。

## Risks / Trade-offs

- 匿名留言可能被刷 → 限流、审核、请求体限制；较强攻击需后续增加边缘限流或验证码。重启会清空限流窗口。
- SQLite 内置模块在当前 Node 22 仍输出实验性提示 → 保持现有最低版本 22.12，运行测试验证，不使用较新 API。
- 昵称可重复和冒用 → 界面说明昵称不代表认证身份，不显示作者徽标。
- 发布时存在未发布草稿 → 本地更新网站应从当前发布快照重新构建，不擅自发布草稿。

## Migration Plan

启动时自动建表。重启后台并用当前发布内容构建新站点。完整备份包含 SQLite 文件；回滚代码不删除留言数据。

## Visibility update

访客选择 public/private，默认 public。历史留言保持 public。审核状态与可见性独立：公开列表必须同时满足 approved 和 public；后台审核不可改变 visibility。私密留言同样可审核，但永不公开。SQLite 启动时为旧表增加 visibility 字段。

## Reply and deletion

每条留言保存一条可编辑纯文本作者回复（最多 2000 字，清空可移除）。回复继承留言公开范围和审核状态，不触发审核通过。私密留言回复仅留在后台，当前无访客身份或通知渠道。作者可确认后永久删除留言及回复。新增 PUT reply 和 DELETE 接口复用后台认证与 CSRF。
