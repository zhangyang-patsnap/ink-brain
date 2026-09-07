## ADDED Requirements

### Requirement: Typed content
The web build SHALL validate article and knowledge-entry frontmatter including title, summary, publication date, topic, maturity, and related-entry identifiers.

#### Scenario: Valid content build
- **WHEN** all content documents satisfy their collection schemas
- **THEN** the static build exposes them to list and detail pages in reverse chronological or intentional learning order

#### Scenario: Invalid content metadata
- **WHEN** a required frontmatter field has an invalid or missing value
- **THEN** the build fails with a content validation error

### Requirement: Article discovery
Visitors SHALL be able to browse seeded technical articles and open a readable article detail page with topic, date, summary, and related references.

#### Scenario: Open an article
- **WHEN** a visitor selects a published article from the writing page
- **THEN** the corresponding Markdown body is rendered with accessible headings and a constrained reading width

### Requirement: Knowledge map
The site SHALL present knowledge entries as linked learning domains rather than only as chronological posts.

#### Scenario: Explore a knowledge domain
- **WHEN** a visitor opens the knowledge page
- **THEN** they can see concept groups, maturity labels, and links to associated articles or framework pages
