## ADDED Requirements

### Requirement: Single author authentication
Administrative data and mutations SHALL require a valid authenticated session; writes SHALL require a trusted origin and CSRF token.

#### Scenario: Unauthenticated access
- **WHEN** a visitor requests draft records or file uploads without authentication
- **THEN** the server rejects access without exposing private content

### Requirement: Structured content editing
Ryan SHALL be able to create and update articles, topics, projects, tools and site settings using labeled fields, save drafts, and archive or restore records.

#### Scenario: Save draft
- **WHEN** Ryan saves valid changes
- **THEN** they survive restart and do not alter the currently published site

### Requirement: Asset library
Authenticated uploads SHALL be bounded, use generated paths, record hashes and support image and software package selection.

#### Scenario: Upload release file
- **WHEN** Ryan uploads an allowed package
- **THEN** its size, SHA-256 and managed URL can populate the tool release fields

### Requirement: Static publication
Publishing SHALL validate and build a draft snapshot before replacing the active public version.

#### Scenario: Build fails
- **WHEN** a publication fails validation or build
- **THEN** the previous public release remains active and the author sees a failure message

#### Scenario: Publish succeeds
- **WHEN** a build succeeds
- **THEN** public pages and assets serve the new snapshot and the previous release can be restored

### Requirement: Author preview
The interface SHALL offer sanitized Markdown previews and a private full-site preview of saved drafts.

#### Scenario: Preview draft
- **WHEN** Ryan builds a preview
- **THEN** the result requires authentication and does not change the active release
