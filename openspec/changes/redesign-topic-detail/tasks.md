## 1. Implementation

- [x] 1.1 Share ordered catalog projection and test that preview and detail counts stay consistent.
- [x] 1.2 Replace topic detail with compact introduction and accessible ordered content guide.

## 2. Verification

- [x] 2.1 Verify real single/mixed/empty topics, long text, keyboard links, themes and mobile layouts in the browser.
- [x] 2.2 Run checks, build and strict spec validation, then update isolated preview without publishing drafts.

## 3. Content type filters

- [x] 3.1 Add accessible All/Article/Project/Tool filters with accurate counts, original ordering and empty states.
- [x] 3.2 Verify filters, keyboard and no-JS behavior, mobile/theme layouts and build; update isolated preview only.

### Filter verification — 2026-09-09

- Astro check: 44 files, zero diagnostics; 8 existing unit tests passed; source and isolated preview builds passed (existing bundle-size warning remains).
- Playwright: all four filters across 320/390/768/1440px, paper/workbench, light/dark (64 states), no overflow or page errors. Desktop/mobile screenshots reviewed.
- Published topic counts 3/1/1/1 verified, original project/article/tool order retained, filtered article still numbered 02. Buttons expose one aria-pressed selection; Tab/Space and visible outline passed.
- Zero-result category and reset-to-all focus passed; empty topic and no-JS fallback passed.
- Strict spec validation and git diff --check passed. Topic preview data synced from existing revision 18 publication; active release d6c80275-86de-406b-9177-d156a00a1a76 unchanged. No new publication.

## Verification record — 2026-09-09

- 8 Node tests passed; full sequence preserves mixed author order, filters unavailable refs, and matches homepage counts/preview.
- Astro check: 43 files, zero errors/warnings/hints. Source and isolated snapshot builds passed (existing bundle-size warning remains).
- Playwright Chrome: 64 combinations of single/mixed/empty/long cases × 320/390/768/1440px × paper/workbench × light/dark, no horizontal overflow.
- Every guide link returned 200. Article/project/tool action labels checked, homepage-to-detail click checked, Tab focus + Enter navigation and JavaScript-disabled rendering passed. No page errors.
- Desktop normal-content first entry starts above 600px. Published single-topic, source multi-item, and mobile dark-workbench screenshots visually reviewed.
- Strict OpenSpec validation and git diff whitespace check passed. Updated only isolated preview at http://127.0.0.1:4332/knowledge/agent-orchestration/.
- Active release c1415ec4-3f57-46cb-9f9d-7b2317b78762 remained unchanged; no drafts published. Test fixtures exist only in temporary staging, not production source.
