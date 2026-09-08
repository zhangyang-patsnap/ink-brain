## ADDED Requirements

### Requirement: Evergreen topic hubs
The knowledge area SHALL organize content as evergreen topic hubs rather than a second chronological or flat article list.

#### Scenario: Open the knowledge index
- **WHEN** a visitor opens the knowledge area
- **THEN** each topic exposes its thesis, maturity, key concepts, and intended learning path

### Requirement: Cross-domain topic relationships
Each knowledge topic SHALL support explicit references to articles, framework Labs, owned projects, tools, and adjacent topics.

#### Scenario: Follow a topic relationship
- **WHEN** a visitor inspects a topic hub
- **THEN** available related artifacts are grouped by domain and link to their canonical pages

### Requirement: Progressive topic disclosure
The knowledge index SHALL provide scannable topic previews and each topic SHALL have a stable detail route for its complete learning path and grouped relationships.

#### Scenario: Move from index to topic detail
- **WHEN** a visitor selects a topic preview
- **THEN** the corresponding topic detail page presents the full thesis, concepts, learning path, and resolvable cross-domain links

### Requirement: Useful sparse state
The topic-hub design SHALL remain understandable and useful before a large content graph exists.

#### Scenario: Topic has few relationships
- **WHEN** a topic contains only Demo or limited references
- **THEN** the page presents a curated path without empty graph controls or misleading relationship counts
