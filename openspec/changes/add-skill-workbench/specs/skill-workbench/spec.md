## ADDED Requirements

### Requirement: Author-managed skills
The system SHALL support revisioned Skill create, edit, draft, publication and deletion through the authenticated author backend, without scanning local Skill directories.

#### Scenario: Existing state
- **WHEN** a draft has no skills collection
- **THEN** it is treated as empty without losing other records

#### Scenario: Referenced skill
- **WHEN** origin is reference
- **THEN** a valid external HTTPS source URL is required and is displayed publicly

### Requirement: Safe uploaded downloads
Skill uploads SHALL support Markdown, ZIP and .skill files as inert attachments. Published skills SHALL have a supported file and matching checksum. Unpublished uploads SHALL stay private.

#### Scenario: Publish or fail
- **WHEN** a published Skill references a missing or mismatching attachment
- **THEN** publication fails without replacing the active release

#### Scenario: Download
- **WHEN** a valid Skill is published
- **THEN** its package is included in the release and downloadable, without executing its contents

### Requirement: Workbench browsing
Public Skill pages SHALL use the approved B layout, with category filtering, actual counts, detail pages and original/reference labels instead of verified/available.

#### Scenario: Responsive browsing
- **WHEN** a visitor browses with keyboard or on mobile in either theme
- **THEN** categories and links remain usable without page overflow

#### Scenario: Demo
- **WHEN** the static example is shown
- **THEN** it is explicitly marked Demo and referenced, with its actual source link
