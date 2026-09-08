## Context

The public application is static Astro. Markdown and TypeScript demo manifests currently require source edits. Ryan is the only author. Existing routes and editorial design remain stable.

## Goals / Non-Goals

Goals: structured editing, draft isolation, authenticated uploads, safe Markdown preview, publication feedback, persistent local storage and recoverable previous releases.

Non-goals: multi-user roles, payments, Git hosting, remote server deployment, binary execution, and automatic app updates.

## Decisions

Use a separate Node/Express server with a plain browser UI. Passwords use scrypt; random sessions use HttpOnly SameSite cookies, explicit trusted origin and CSRF validation. First-run setup is allowed only on loopback; remote hosting requires a configured password and HTTPS origin. Uploaded raster images and release packages receive generated names, bounded streaming uploads and SHA-256 hashes. HTML, SVG and executable scripts are rejected; assets are private until publication.

Persist the draft document atomically as JSON with revision checks. Seed it once from the existing Markdown and JSON manifests. A draft save never modifies source files or the active public release. Publish copies source to an isolated build directory, writes the selected content, runs Astro in a child process, and atomically replaces a release pointer after success. Concurrent publishing is rejected. Prior releases remain available for rollback.

The admin server serves the current public build at / and the author interface at /admin/. In development this is port 4322; the original Astro developer server at 4321 remains a source-code preview, not the managed publication. The production origin is configured explicitly.

## Risks / Trade-offs

- Local storage requires a persistent disk and backups; document and provide an authenticated export.
- Build snapshots consume disk; retain versions for rollback and document maintenance rather than deleting user releases automatically.
- Server-side builds consume resources; serialize them and enforce a timeout.
- Markdown must remain data; sanitize preview and published content and reject MDX authoring.
