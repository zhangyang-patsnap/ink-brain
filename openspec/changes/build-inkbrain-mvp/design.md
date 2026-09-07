## Context

InkBrain starts from an empty directory. The first release is a content-first personal technical publication for a senior backend engineer, with future expansion into independently runnable AI framework labs and server-backed developer tools. The build must be useful without a database, credentials, or long-running backend process.

## Goals / Non-Goals

**Goals:**

- Ship a polished, responsive, accessible web experience that works as a static build.
- Keep technical writing in repository-owned Markdown with typed metadata.
- Establish discoverable framework pages and an explicit protocol for future independent Lab processes.
- Deliver a polished, non-functional browser-local tool demonstration as the visual extension pattern for a larger toolbox.
- Keep the monorepo ready for later Java, Python, and Rust services without creating unused infrastructure.

**Non-Goals:**

- Authentication, comments, analytics, persistence, or a content-management backend.
- Starting or executing arbitrary framework code from the public web application.
- A production Java control plane, database, queue, or container orchestration layer.
- Exhaustive framework documentation or a large initial article catalog.

## Decisions

### Astro owns the first web release

The site uses Astro with strict TypeScript because most pages are content and can ship as static HTML, while interactive tools can remain isolated client-side islands. A full React application or Spring-rendered site would add runtime and hydration cost before dynamic product requirements exist.

### Content lives with the web application

Articles and knowledge entries live in Astro content collections under `apps/web/src/content`. Zod-backed schemas validate frontmatter during builds. Cross-links use stable slugs and explicit `related` metadata rather than a database graph.

### Labs are independent packages behind a future protocol

The root `labs` directory contains language-specific package boundaries and documentation. The web catalog uses static manifests and never imports Lab runtime code. Future processes will expose health, metadata, run, event-stream, and cancellation endpoints through a shared contract.

### Editorial visual system with native CSS

The site uses semantic CSS variables rather than a component design-system dependency. The visual language is cool paper, near-black ink, and one restrained vermilion accent. Layout is editorial and asymmetric on wide screens, then collapses to a strict single column below 768px. Motion is limited to hover, focus, and short entrance transitions with reduced-motion fallbacks.

### System theme with manual override

Light and dark tokens follow `prefers-color-scheme` by default. A small inline script restores a saved user choice before paint, and an accessible button lets the user cycle the active theme without a framework runtime.

### Browser-local tool demonstration

The JSON formatter surface demonstrates input, output, controls, empty state, and error presentation without claiming to provide working transformations. Actions are explicitly marked as demo-only. Functional tools are deferred until the shared visual language and content skeleton are accepted.

### Demo visit metric before analytics

The global footer includes a centralized, clearly labeled Demo visit total so the first-phase UI can establish the final information hierarchy without implying that analytics or persistence already exists. A future analytics integration will replace only the metric data source.

### Generated visual is a repository asset

The homepage uses one original wide abstract image suggesting ink, neural connections, and layered technical notes. It contains no text or trademarks and is served locally with fixed dimensions to avoid layout shift.

## Risks / Trade-offs

- [Astro content APIs can change between major versions] -> Pin the generated dependency versions and validate with `astro check` and a production build.
- [Static manifests can drift from future running Labs] -> Treat them as editorial metadata until a control plane implements live discovery.
- [Generated imagery may dominate a technical publication] -> Use a restrained crop, low contrast, and a single placement in the homepage hero.
- [A monorepo can imply services that do not exist] -> Placeholder Lab directories contain contracts and start criteria only; status labels explicitly say `planned` or `documented`.
- [Theme initialization can flash] -> Run the theme bootstrap script in the document head before the body is painted.

## Migration Plan

1. Build the static web application and content collections.
2. Validate routes, theme behavior, responsive layout, demo labeling, and production output.
3. Add independently runnable Labs one at a time without changing web build ownership.
4. Introduce a Platform API only when live run management, persistence, or secret-backed tools are required.

Rollback is file-based: remove `apps/web` and the new root documentation and Lab placeholders. No external state or persistent data is created.

## Open Questions

- Final public domain and canonical site URL.
- Author display name, biography, avatar, and external profile links.
- Which AI framework will become the first genuinely runnable Lab.
