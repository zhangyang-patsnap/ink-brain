## MODIFIED Requirements

### Requirement: Safe uploaded downloads
Skill uploads SHALL support Markdown, ZIP and .skill files as inert attachments. Published skills SHALL have a supported file and matching checksum. Unpublished uploads SHALL stay private. Archive uploads SHALL be readable for metadata only, without extraction to disk and without executing any contained content.

#### Scenario: Publish or fail
- **WHEN** a published Skill references a missing or mismatching attachment
- **THEN** publication fails without replacing the active release

#### Scenario: Download
- **WHEN** a valid Skill is published
- **THEN** its package is included in the release and downloadable, without executing its contents

#### Scenario: Archive metadata extraction
- **WHEN** an author uploads a ZIP or .skill archive containing `SKILL.md`
- **THEN** its front matter and body are parsed in memory and offered as form values, and no archive entry is written to disk

#### Scenario: Archive without an entry document
- **WHEN** an uploaded archive contains no `SKILL.md` at its root or in a single wrapper folder
- **THEN** the upload is kept as a downloadable attachment and the author is told the document was not found

#### Scenario: Hostile archive
- **WHEN** an uploaded archive exceeds the entry count, single-entry size, total uncompressed size or compression ratio limits, or contains a traversal path, an absolute path or a symbolic link
- **THEN** parsing is refused with a readable error and nothing is extracted

## ADDED Requirements

### Requirement: Author-controlled metadata fill
Parsed archive metadata SHALL populate empty Skill form fields only, SHALL NOT overwrite author-entered values, and SHALL NOT save or publish the record on its own.

#### Scenario: Empty fields
- **WHEN** an archive is parsed and the name, summary, version or documentation field is empty
- **THEN** the parsed value is placed in that field and the record stays an unsaved draft

#### Scenario: Existing content
- **WHEN** a field already holds author-entered content
- **THEN** parsing leaves it unchanged
