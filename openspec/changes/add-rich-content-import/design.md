## Context

The author admin already stores private uploads, inserts image Markdown, sanitizes body previews, and sanitizes body HTML again during publication. The editor is plain Markdown by design. HTML and Markdown files are currently rejected by the upload allowlist, and draft image URLs cannot load in the body preview because `/media/` contains only published assets.

## Goals / Non-Goals

**Goals:**

- Import HTML, Markdown and raster images without leaving an article or topic editor.
- Insert at the body cursor and render the resulting body immediately.
- Preview uploaded text documents in the private asset library.
- Preserve draft isolation and the existing publication sanitizer.

**Non-Goals:**

- A visual WYSIWYG editor, MDX execution, JavaScript execution, HTML website hosting, document conversion fidelity, or support for referenced files bundled beside an uploaded HTML document.

## Decisions

- Extend the existing upload path rather than add a second storage system. Text documents receive generated filenames and private asset metadata like every other upload.
- Limit HTML and Markdown documents to 2 MB, require valid UTF-8, and reject NUL bytes. Package limits remain unchanged. This bounds server-side rendering and prevents binary files disguised as documents.
- Return document source only from a new authenticated asset-source endpoint. The browser inserts source into the textarea; it never assigns imported source to `innerHTML`.
- Use the existing Markdown and HTML sanitizer for document previews and body previews. Uploaded scripts, event handlers and executable links are removed. Preview documents are framed with a restrictive CSP and sandbox.
- Rewrite `/media/<generated-name>` image URLs only in authenticated body-preview output so private images render before publication. Stored Markdown and published URLs remain `/media/`.
- Add an editor-local upload control and retain a library selector. Images insert Markdown syntax; HTML and Markdown insert text source. Both paths update the body at its current selection and automatically refresh the preview.

## Risks / Trade-offs

- **HTML visual fidelity is intentionally limited** → Render only sanitized semantic HTML with a neutral preview stylesheet; do not preserve scripts or arbitrary page CSS.
- **Large documents can consume memory** → Enforce a 2 MB text-document limit before decoding or rendering.
- **An imported document can replace editorial structure accidentally** → Insert at the current selection rather than silently replacing the whole body, and keep normal unsaved-change behavior.
- **Relative resources in HTML may not resolve** → Document that standalone HTML imports include structure only; authors must upload images separately.
