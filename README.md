# InkBrain

InkBrain is a personal technical publication for AI application architecture, backend engineering, independently runnable framework labs, and small developer tools.

## Current release

The first release is static-first:

- Astro and strict TypeScript web application
- Repository-owned Markdown articles and knowledge entries
- AI framework catalog with explicit runtime status
- Clearly labeled developer-tool UI demonstrations
- Light and dark themes
- RSS and sitemap output

No database, login, model credential, runtime control plane, or completed feature-module logic is included in phase one.

## Run locally

```bash
npm install
npm run dev
```

The development server prints the local URL. Production checks:

```bash
npm run check
npm run build
```

Set `SITE_URL` during production builds to produce canonical sitemap and feed URLs.

## Structure

- `apps/web`: public Astro site
- `labs`: independent AI framework runtime boundaries
- `packages/lab-protocol`: shared HTTP and event contract
- `docs`: architecture and authoring conventions
- `openspec`: change proposals, specifications, designs, and tasks

## Status language

- `published`: content is available to readers
- `verified`: implementation has repeatable evidence
- `documented`: integration boundary is defined, runtime is not shipped
- `planned`: roadmap item, not working functionality
