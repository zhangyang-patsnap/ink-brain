## Why

The author currently has to leave the editor to upload an image, and uploaded HTML or Markdown documents cannot be previewed or inserted. This interrupts writing and makes it unclear where imported material will appear.

## What Changes

- Accept HTML and Markdown documents in the private asset library alongside existing image and package formats.
- Add an editor-local upload control for HTML, Markdown, PNG, JPEG and WebP files.
- Insert imported document source or image Markdown at the current body cursor and immediately render the sanitized body preview.
- Render HTML and Markdown asset previews in a sandbox without executing uploaded scripts.
- Rewrite private image references for author previews while retaining public `/media/` references in published content.

## Capabilities

### New Capabilities

- `rich-content-import`: Safe document and image upload, cursor-aware insertion, and immediate sanitized rendering for author content.

### Modified Capabilities

None.

## Impact

This affects the admin upload allowlist and validation, authenticated asset APIs, Markdown preview response, editor toolbar, file-library cards, and admin tests. It adds no runtime dependency and does not allow raw HTML or scripts to execute on the author or public site.
