## 1. Implementation

- [x] 1.1 Build isolated editorial writing-home component and responsive theme-aware styling.
- [x] 1.2 Add progressively enhanced local search with all-article coverage and reset/empty states.

## 2. Verification

- [x] 2.1 Test search, rendering boundaries, drafts, keyboard, mobile and both theme/color combinations.
- [x] 2.2 Run Astro check/build and OpenSpec validation; update isolated published-content preview without publishing drafts.

## Verification record

- 2026-09-09: `node --test apps/web/test/article-search.test.mjs` passed 3 tests; `npm run check` reported 0 errors/warnings/hints; `npm run build` succeeded (existing Mermaid chunk-size warning only); OpenSpec strict validation and `git diff --check` passed.
- Chrome tested title/summary search, Unicode full-width and multi-word queries, Chinese IME composition, literal HTML input, Enter without navigation, clear/focus restoration and no search network requests.
- 320/390/768/1024/1440px × paper/workbench × light/dark: no page overflow; mobile single column and desktop two columns. Switching themes preserved search results. All detail links returned 200.
- Isolated fixture builds tested zero/one article, draft exclusion, latest lead selection, long unbroken title/summary, and no-JavaScript static reading. Fixtures exist only in temporary preview, not production source.
- Visually checked real published articles in desktop paper/workbench and mobile dark styles. Preview content matches the active release article data. Preview URL: http://127.0.0.1:4332/writing/.
- Did not change active release, drafts, topic/project home, shared ArticleRow or article details. Formal visitor update requires the existing admin 发布 action.
