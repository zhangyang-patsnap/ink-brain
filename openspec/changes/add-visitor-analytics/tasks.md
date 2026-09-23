## 1. Backend statistics module

- [x] 1.1 Add `apps/admin/stats.mjs`: in-memory daily dedup (IP+UA hash with a per-day rotating, never-persisted salt), debounced/serialized persistence to `stats.json` via `atomicJson`/`readJson`, `recordVisit`/`summary`/`articleVisitors`/`flush`/`close`.
- [x] 1.2 Wire into `apps/admin/server.mjs`: `clientIp()` helper honoring `ADMIN_TRUST_PROXY` (default off, last `X-Forwarded-For` hop when on), a visit-recording middleware filtering method/bot-UA/empty-UA and counting only 200+HTML finishes outside `/admin` and `/api/`, public `GET /api/stats/summary` and `GET /api/stats/articles?ids=...` routes with `Cache-Control: no-store`, and a `stats.close()` call in the `SIGTERM`/`SIGINT` handlers before the server closes.

## 2. Frontend display

- [x] 2.1 Add `apps/web/src/lib/visitor-stats.ts` with `hydrateSiteTotal()` and `hydrateArticleViews()`, both failing silently on fetch error or non-OK response.
- [x] 2.2 `SiteFooter.astro`: remove the hardcoded `siteStats`/DEMO badge, add a `[data-total-visitors]` element and script call; rename the label to "累计访客". Remove the now-unused `siteStats` export from `data/site.ts` and the now-dead `.footer-stat-status` CSS rule.
- [x] 2.3 `WritingHome.astro`, `ArticleRow.astro`, `pages/writing/[id].astro`: add `[data-article-views]` elements next to the existing reading-time text, reusing existing meta styling; extend each component's existing script block to call `hydrateArticleViews()`.

## 3. Configuration and docs

- [x] 3.1 Document `ADMIN_TRUST_PROXY` in `.env.example`, `README.md`, and `apps/admin/README.md`, with an explicit warning about the single-trusted-proxy precondition.

## 4. Tests

- [x] 4.1 Add `apps/admin/test/stats.test.mjs` covering: same ip+ua deduped same day; different ip or ua counted separately; bot/empty UA and non-200/non-HTML responses excluded; per-article dedup and bogus-slug 404 exclusion; `trustProxy` off ignores XFF, on trusts the last hop; public endpoint shapes, no-store header, and graceful invalid/unknown id filtering; day-rollover resets dedup without resetting cumulative totals; persistence round-trip after `close()`/fresh `createStats()`.

## 5. Verification

- [x] 5.1 Run `npm run test:admin`, `npm run check`, `npm run build`.
- [x] 5.2 Manually smoke-test via a running `apps/admin/server.mjs` instance against an isolated temp data directory: publish a draft, confirm `curl`'s default UA is excluded, confirm refresh with a real UA dedupes while a different UA counts as a new visitor, confirm a fabricated article slug 404s and is not counted while a real article's repeated visit dedupes to one, confirm the built HTML carries the `data-total-visitors`/`data-article-views` markers and the bundled `visitor-stats` script.
- [x] 5.3 `openspec validate add-visitor-analytics --strict`.

## Verification record

- 2026-09-23: `npm run test:admin` — 35/35 passing (6 new stats tests). `npm run check` — 0 errors/warnings/hints. `npm run build` — succeeded (pre-existing Mermaid chunk-size warning only, unrelated to this change).
- Manual smoke test against an isolated `ADMIN_DATA_DIR` on a temp port: published a draft via the admin API; confirmed `curl`'s default `User-Agent: curl/...` produced `totalVisitors: 0`; confirmed a browser-like UA counted once across two identical requests (refresh dedup) and a second, distinct UA incremented the total; confirmed a real article slug's repeated visit deduped to 1 while a fabricated slug 404ed and was not counted; confirmed the built `dist/` HTML contains `data-total-visitors` and `data-article-views` attributes and a `<script type="module" src="/_astro/visitor-stats.*.js">` reference. Temp server and data directory removed after the test.
