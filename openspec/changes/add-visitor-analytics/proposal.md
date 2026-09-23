## Why

页脚的「累计访问」是硬编码字符串（`12,846`），并明确标注为 `DEMO`。文章没有任何阅读量概念，只有作者填写的静态阅读分钟数。这些是假数据，需要换成真实的游客访问统计。

## What Changes

- 后台按「IP + User-Agent 哈希、按天去重」的方式统计独立访客，不使用 Cookie，不需要访客端埋点参与去重。
- 统计两类数字：站点累计独立访客数，以及每篇文章的独立阅读人数；两者都展示去重后的数字。
- 游客页面通过实时公开接口拉取数字并回填，不随发布快照打入静态页面。
- 明显的爬虫/脚本 User-Agent、空 UA、非 200 响应、非 HTML 响应不计入统计。
- 新增可选环境变量 `ADMIN_TRUST_PROXY`（默认关闭），开启后信任 `X-Forwarded-For` 最后一段以在反向代理部署下拿到真实客户端 IP；这是对现有「不信任任意代理头」安全姿态的一个显式、窄范围例外，只影响统计模块，不影响登录限流。
- 删除页脚的硬编码 DEMO 数据和相关死代码；文案由「累计访问」改为「累计访客」，因为展示的是去重后的独立访客数。

## Capabilities

### New Capabilities
- `visitor-analytics`: 站点累计访客统计与文章独立阅读数统计，实时接口驱动，隐私边界明确（只持久化聚合计数，不持久化任何可关联访客的数据）。

### Modified Capabilities
无。

## Impact

新增 `apps/admin/stats.mjs` 及公开只读接口；修改 `apps/admin/server.mjs`（计数中间件、接口路由、信号处理）；修改 `apps/web` 的页脚、文章列表与详情组件及其样式；新增 `apps/web/src/lib/visitor-stats.ts`；补充 `.env.example`、`README.md`、`apps/admin/README.md` 的 `ADMIN_TRUST_PROXY` 说明；新增 `apps/admin/test/stats.test.mjs`。不引入新依赖，不涉及数据库。
