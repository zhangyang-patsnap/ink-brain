## ADDED Requirements

### Requirement: Distinct global destinations
The primary navigation SHALL expose Writing, Knowledge, Labs, Projects, Tools, and About as distinct destinations.

#### Scenario: Navigate on desktop
- **WHEN** a visitor opens any public page at desktop width
- **THEN** all six destinations remain legible and the active domain is identifiable

#### Scenario: Navigate on mobile
- **WHEN** a visitor opens the compact navigation
- **THEN** all six destinations are reachable in a DOM order matching their visual order

### Requirement: Homepage architecture preview
The homepage SHALL summarize the distinct role of Writing, Knowledge, Labs, Projects, and Tools without implying Demo artifacts are live.

#### Scenario: First visit after restructuring
- **WHEN** a visitor scans the homepage destinations
- **THEN** they can distinguish explanation, organization, experimentation, owned work, and downloadable software
