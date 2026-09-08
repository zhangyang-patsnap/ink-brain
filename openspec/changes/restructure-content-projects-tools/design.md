## Context

InkBrain currently has a polished static Astro shell, typed article and knowledge collections, a framework manifest, and a tools page. The visual system is accepted, but each area lacks a sharp domain boundary: writing has only a free-form topic, knowledge is a second list, framework research has no distinction between external study and owned work, and tools are presented as an online formatter rather than distributable products.

The author will progressively replace all Demo records with real content. The implementation must therefore make the domain model obvious, keep content repository-owned, remain static-first, and never imply that a project, Lab, release, or download is usable unless evidence is supplied.

## Goals / Non-Goals

**Goals:**

- Give every artifact one canonical home while allowing explicit cross-links.
- Make article taxonomy useful without turning the publication into a tag cloud.
- Make knowledge pages durable topic hubs rather than a decorative graph.
- Separate owned projects from third-party framework experiments.
- Present Tools as a credible software catalog prepared for DMG, CLI, plugin, and online-tool releases.
- Preserve the established editorial atlas visual world and static Astro build.

**Non-Goals:**

- Functional search, client-side filter state, download counting, authentication, payments, reviews, or update delivery.
- Hosting actual DMG files or claiming Demo releases are available.
- Implementing or starting any Agent framework runtime.
- An interactive force-directed knowledge graph.

## Decisions

### One canonical domain per artifact

Writing explains complete engineering questions. Knowledge organizes evergreen domains. Labs record experiments and third-party framework study. Projects present software the author owns. Tools distribute smaller end-user utilities. Cross-links connect domains, but records are not duplicated.

An owned Agent framework is therefore a Project. Its design articles remain Writing entries, its reusable concepts appear in Knowledge topics, and individual verification runs can appear in Labs.

### Categories are controlled; tags remain flexible

Each article receives one category from a small centralized catalog, zero or more tags, and an optional series. Category and tag pages are generated statically. The writing index exposes the controlled categories as the primary browse affordance and keeps tags secondary to avoid visual noise.

### Knowledge becomes topic-led

Knowledge entries become topic hubs with a thesis, learning-path steps, key concepts, and typed references to articles, Labs, projects, and tools. The index remains a scannable topic preview and links to stable topic detail routes where the complete path and grouped relationships live. The first release uses editorial columns and relationship registers rather than an interactive graph; this remains useful with four Demo topics and scales as content grows.

### Projects and tools use typed static manifests

Project and tool catalogs are TypeScript data modules in phase one because their structured release metadata, actions, and status are concise and Demo-owned. Stable detail routes are generated with `getStaticPaths`. A later move to content collections remains possible when long-form authoring becomes necessary.

Project status distinguishes `concept`, `building`, `released`, and `verified`. Tool availability distinguishes `demo`, `available`, and `retired`. Download actions render disabled for Demo records and direct external links only for supplied releases.

### Tool market leads with downloadable software

The Tools index leads with product cards/list rows for macOS applications, CLIs, and plugins. Browser utilities are a secondary catalog type. Detail pages include platform, version, package, size, requirements, release date, release notes, and checksum fields. Demo pages visibly state that no package is currently downloadable.

### Navigation expands without changing the visual identity

The primary navigation becomes Writing, Knowledge, Labs, Projects, Tools, and About. The homepage destination register adds Projects and rewrites Tools around downloadable software. The header retains its compact editorial treatment and collapses to the existing accessible mobile disclosure.

### Responsive topology favors reading order

Wide screens use asymmetric feature areas and aligned registers; narrow screens collapse into a single DOM-consistent reading order. Catalog metadata moves below identity text rather than into horizontal scrollers. Tags wrap, and all action targets remain keyboard reachable.

## Risks / Trade-offs

- [Six primary destinations can crowd intermediate widths] → Tighten only the navigation gap at the existing intermediate breakpoint and keep the mobile disclosure below 768px.
- [Taxonomy can become inconsistent] → Keep categories in one typed catalog and validate article category slugs against a schema enum.
- [Demo downloads may disappoint visitors] → Disable the primary action, show `DEMO / NOT AVAILABLE`, and explain what real release evidence will replace it.
- [Knowledge hubs require curated references] → Use typed identifiers and render only resolvable Demo relationships; do not infer relationships automatically.
- [Projects and Tools can overlap] → Treat strategic owned systems as Projects and small distributable utilities as Tools; link a tool back to a parent project when needed.

## Migration Plan

1. Extend article and knowledge schemas and update all Demo content.
2. Add centralized category, project, and tool manifests.
3. Add taxonomy, project, and tool detail routes.
4. Rework the five affected indexes, navigation, homepage, and shared styles.
5. Validate content schemas, routes, accessibility, light/dark themes, and responsive layouts.

Rollback is file-based: revert the new routes and data/schema fields, then restore the prior navigation and page compositions. No persistent or external state is created.

## Open Questions

- Real project name, logo, repository, documentation URL, and release status for the self-developed Agent framework.
- Which downloadable app will supply the first real DMG, screenshots, signing/notarization status, and checksum.
- Whether real release files will live in GitHub Releases, Cloudflare R2, or another object store.
