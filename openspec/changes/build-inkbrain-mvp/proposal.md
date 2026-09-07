## Why

InkBrain needs a maintainable first release that can publish technical knowledge now while leaving clean boundaries for independently runnable AI framework labs and future backend services. The initial build should already feel like a polished personal technical publication instead of a generic blog template.

## What Changes

- Create an Astro and TypeScript web application with responsive light and dark themes.
- Add a concise editorial homepage, global navigation, footer, metadata, RSS, and sitemap foundations.
- Add Markdown-backed article and knowledge content with typed frontmatter and relationship metadata.
- Add framework and lab catalog pages that describe independent runtimes without coupling them to the web process.
- Add a developer tools hub with a clearly labeled JSON formatter UI demo and extension boundaries for future tools.
- Add repository conventions, shared lab protocol documentation, and placeholder lab packages for Python, Java, and Rust runtimes.
- Add automated type, build, and content checks for the initial release.

## Capabilities

### New Capabilities

- `site-experience`: Responsive application shell, navigation, theming, metadata, and homepage experience.
- `technical-content`: Typed Markdown articles and knowledge entries with browse and detail experiences.
- `framework-catalog`: Framework discovery pages and an implementation-neutral contract for independent labs.
- `developer-tools`: A tools directory and honest UI demonstrations for future browser-local and server-backed tools.

### Modified Capabilities

None.

## Impact

- Introduces the initial `apps/web`, `labs`, `packages`, and `docs` project structure, with content owned by the web application.
- Adds Node.js and Astro build dependencies; no database, persistent backend, or completed feature-module implementation is introduced.
- Establishes future lab HTTP and SSE boundaries but does not expose arbitrary remote code execution.
- All sample content is repository-owned and can be replaced without changing page structure.
