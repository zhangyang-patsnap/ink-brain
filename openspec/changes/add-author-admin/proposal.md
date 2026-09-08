## Why

Ryan needs to maintain articles, topics, projects, software releases, and assets without editing application source. The static publication needs authenticated authoring and a reliable publication boundary.

## What Changes

- Add a single-author management server and browser UI with first-run password setup, login, logout, drafts, preview, forms, file uploads, and site settings.
- Keep drafts private and publish an isolated static Astro snapshot, switching the public version only after a successful build.
- Keep uploads and content on persistent local storage with documented backup and deployment instructions.

## Capabilities

### New Capabilities

- `author-admin`: Authenticated authoring, file library, and atomic static publication.

### Modified Capabilities

None.

## Impact

Adds apps/admin, shared JSON content manifests, publication integration, tests, and operating documentation. Does not upload source code to external services or deploy to the user's server.
