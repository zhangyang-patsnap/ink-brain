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

The author backend runs as a separate Node process and serves the published site:

```bash
npm run admin
```

## Configuration

Copy `.env.example` to `.env` and fill in the values for the environment. `npm run admin` reads
`.env.local` then `.env`; variables already present in the environment take precedence. Neither file
is committed. Only the executable entry point loads them, so tests and programmatic `createApp()`
calls are unaffected.

| Variable | Purpose |
| --- | --- |
| `ADMIN_DATA_DIR` | Absolute path to the content directory. **Must point outside the repository in production.** Defaults to `.inkbrain/` in the repository root, which suits local development only. |
| `ADMIN_ORIGIN` | Public origin of the backend and site, without a trailing slash. Must match the address the browser uses. |
| `ADMIN_HOST` | Listen address. Keep `127.0.0.1` behind a reverse proxy. |
| `ADMIN_PORT` | Listen port, `4322` by default. |
| `ADMIN_PASSWORD` | Initial password used only when no author exists yet. Change it before exposing the backend. |
| `SITE_URL` | Address used for canonical, RSS and sitemap output. Defaults to `ADMIN_ORIGIN`. |

## Content storage

All authored content lives in the backend data directory, not in Git: drafts, uploaded files,
release snapshots and the author password hash. The repository only carries code and the static
seed data under `apps/web/src/data/`.

**Keep the data directory outside the repository in production.** With it inside, `git pull`, a
fresh clone or a change of deployment directory can take the entire content set with it. Set
`ADMIN_DATA_DIR` to a persistent path such as `/var/lib/inkbrain`.

The backend prints its data directory on startup. It also warns when it listens on a non-loopback
address while the data directory still sits inside the repository.

When moving an existing deployment onto a persistent directory, stop the service first and move the
whole directory. `assets.json` and `uploads/` must move together — publication verifies every
attachment against its recorded SHA-256 and fails if they disagree.

See `apps/admin/README.md` for the directory layout, backup procedure and deployment constraints.

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
