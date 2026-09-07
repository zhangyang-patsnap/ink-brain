## Why

The first UI establishes a strong visual language, but its information architecture does not yet match how InkBrain will grow: articles lack useful taxonomy, the knowledge page duplicates a flat content list, self-developed products have no canonical home, and the tools page is centered on an online formatter rather than downloadable software. This change gives writing, knowledge, experiments, owned projects, and distributed tools distinct responsibilities before real content replaces the demos.

## What Changes

- Add primary categories, reusable tags, and optional series metadata to technical writing, with browse controls and generated taxonomy routes.
- Replace the flat knowledge-card page with topic hubs that connect concepts, articles, framework experiments, projects, and tools into an intentional learning path.
- Keep Framework Labs focused on third-party framework study and verifiable experiments instead of treating every framework as an owned product.
- Add a Projects area for self-developed frameworks, applications, and libraries, including a representative owned Agent framework project.
- Reframe Developer Tools as a software-market experience led by downloadable macOS apps, CLIs, and plugins, with online utilities as a secondary category.
- Add typed, repository-owned Demo manifests for projects, releases, downloads, requirements, checksums, and cross-content relationships.
- Update the global navigation and homepage destinations while preserving the current editorial visual system, static-first delivery, responsive behavior, and honest Demo/status language.

## Capabilities

### New Capabilities

- `content-taxonomy`: Article categories, tags, series, browse controls, and stable taxonomy routes.
- `knowledge-topics`: Evergreen topic hubs with learning paths and cross-links to articles, Labs, projects, and tools.
- `project-showcase`: Canonical presentation for self-developed frameworks, apps, and libraries with maturity, documentation, releases, and evidence.
- `software-market`: Download-oriented catalog and detail pages for macOS apps, CLIs, plugins, and secondary browser tools.
- `navigation-model`: Updated global navigation and homepage discovery paths reflecting the new content architecture.

### Modified Capabilities

None. The original capabilities have not yet been archived into the main specification set; this change defines the expanded requirements independently while retaining compatible routes where useful.

## Impact

- Updates Astro content schemas, Demo Markdown, typed data manifests, global navigation, homepage destinations, and affected list/detail pages under `apps/web`.
- Adds static routes for article categories, tags, projects, and downloadable tool details.
- Keeps `/writing/`, `/knowledge/`, `/frameworks/`, and `/tools/` stable; no backend, database, analytics, or working download artifact is introduced.
- Demo download links remain explicitly unavailable until the author supplies real DMG, CLI, plugin, or release assets.
