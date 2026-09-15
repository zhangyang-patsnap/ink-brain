## 1. Theme implementation

- [x] 1.1 Add independent style initialization and accessible header toggle with storage fallback.
- [x] 1.2 Add scoped workbench tokens and responsive reading layout, preserving paper and day/night modes.

## 2. Verification

- [x] 2.1 Verify desktop/mobile, both color modes, reload/navigation, keyboard, storage failures, TOC and diagrams in a browser.
- [x] 2.2 Run Astro check/build and OpenSpec validation; document preview and publishing boundary.

## Verification record

- 2026-09-09: Astro check passed (0 errors/warnings/hints), build passed; existing Mermaid chunk-size warning remains. OpenSpec strict validation and git diff --check passed.
- Headless Chrome: 320/390/800/1024/1440px, both styles and both color modes have no article page overflow. Desktop TOC, mobile collapsible TOC, keyboard activation and full-window diagram/Escape passed.
- Reload and six visitor routes preserve preferences; invalid style and blocked localStorage fall back safely with functional controls. Restoring paper reproduces the original article text, computed font and page background. No browser page errors.
- Visually inspected workbench desktop/mobile/dark and homepage screenshots. Tightened action spacing below 400px.
- Latest published content was copied to an isolated preview on port 4332. The active release and draft data were not changed. Visitor production updates require the existing admin 发布 action.
