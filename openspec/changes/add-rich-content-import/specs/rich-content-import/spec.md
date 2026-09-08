## ADDED Requirements

### Requirement: Private document uploads
The author admin SHALL accept `.html`, `.htm`, `.md`, and `.markdown` files as private assets, SHALL require valid UTF-8 text without NUL bytes, and SHALL reject text documents larger than 2 MB.

#### Scenario: Upload a Markdown document
- **WHEN** an authenticated author uploads a valid Markdown file within the limit
- **THEN** the system stores it under a generated name and records it as a private Markdown asset

#### Scenario: Reject an invalid document
- **WHEN** an authenticated author uploads an oversized, binary, or invalid UTF-8 HTML or Markdown file
- **THEN** the system rejects the upload and removes the incomplete stored file

### Requirement: Safe document rendering
The author admin SHALL render HTML and Markdown asset previews only after sanitization and SHALL NOT execute uploaded scripts, inline event handlers, or executable links.

#### Scenario: Preview hostile HTML
- **WHEN** an authenticated author previews an uploaded HTML file containing scripts or event handlers
- **THEN** the rendered preview retains safe content and omits executable content

### Requirement: Cursor-aware rich content insertion
The article and topic editors SHALL let the author upload or select HTML, Markdown, PNG, JPEG, or WebP content, insert it at the current body selection, and immediately refresh the sanitized body preview.

#### Scenario: Insert a document
- **WHEN** the author selects a stored HTML or Markdown asset while the body has a cursor or selection
- **THEN** its source replaces the selection at that position and the rendered preview appears

#### Scenario: Insert an image
- **WHEN** the author uploads or selects a supported raster image
- **THEN** an image Markdown reference is inserted at the current selection and the private image appears in the rendered preview

### Requirement: Draft and publication isolation
Imported documents and images SHALL remain private until their sanitized content or referenced asset is included in a successful publication.

#### Scenario: Preview before publication
- **WHEN** the author previews a body containing a private image
- **THEN** the authenticated preview serves the private image without making its public `/media/` URL available
