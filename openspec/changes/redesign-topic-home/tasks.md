## 1. Implementation

- [x] 1.1 Add accurate catalog-based preview/count projection and tests.
- [x] 1.2 Implement exhibition homepage with real topics and responsive theme styling.

## 2. Verification

- [x] 2.1 Verify multiple/single/empty topics, mixed references, links, long text, mobile and both themes in the browser.
- [x] 2.2 Run checks/build/spec validation and update isolated published-content preview without publishing drafts.

## Verification record — 2026-09-09

- Node tests: 6 passed, including mixed-reference order/counts, unavailable references and empty topics.
- Astro check: 0 errors/warnings/hints. Production and isolated snapshot builds passed; existing large-chunk warning remains.
- Playwright/Chrome: source collection (4 topics), published snapshot (1 topic), all homepage content/detail links return HTTP 200.
- 32 viewport/theme combinations: 320/390/768/1440px × paper/workbench × light/dark × source/snapshot; no horizontal overflow, mobile label before content.
- Isolated fixtures verified empty collection and long title/summary; source includes an empty topic. First-two preview and remaining-count link verified.
- Keyboard focus outline and JavaScript-disabled content/links passed. No browser page errors. Desktop and mobile screenshots visually reviewed.
- Strict OpenSpec validation and git diff whitespace check passed. Preview updated at http://127.0.0.1:4332/knowledge/; no draft publishing or active release mutation performed.
