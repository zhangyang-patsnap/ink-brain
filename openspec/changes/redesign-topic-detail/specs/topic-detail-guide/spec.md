## ADDED Requirements

### Requirement: Filter by existing content type
The guide SHALL offer All, Article, Project and Tool filters with accurate counts while preserving configured relative order and original sequence numbers.

#### Scenario: Select and reset a filter
- **WHEN** a visitor selects a content type and then All
- **THEN** only that type is first shown, followed by the complete original list, with no navigation or data mutation

#### Scenario: Empty category and accessibility
- **WHEN** a category has no entries
- **THEN** selecting it shows an explicit empty-result message; buttons expose their selected state, support keyboard use, and announce result counts

#### Scenario: JavaScript unavailable
- **WHEN** client scripts are unavailable
- **THEN** all content remains visible and inactive filter controls are not displayed

### Requirement: Compact topic introduction
The page SHALL show a return link, complete topic title and summary, and counts of available content in a compact exhibition-inspired introduction.

#### Scenario: Open a topic
- **WHEN** a visitor opens a topic detail route
- **THEN** the introduction and sequence share a left alignment, and the title uses 32–40px desktop sizing rather than a poster-scale hero

### Requirement: Ordered content entry points
The page SHALL show every available reference in configured order, with its type, title, summary and a meaningful action for articles, projects or tools.

#### Scenario: Mixed content
- **WHEN** the topic references articles, projects and tools in an interleaved order
- **THEN** the order is preserved and each item links to its existing public detail route with 阅读文章, 查看项目 or 使用工具

#### Scenario: Unavailable references
- **WHEN** references are missing from the visitor catalog
- **THEN** they do not produce links or contribute to counts; no valid items produces a content-preparation empty state

### Requirement: Accessible responsive guide
The guide SHALL preserve full text, keyboard focus and working links without client JavaScript across paper/workbench and light/dark modes.

#### Scenario: Narrow viewport and long text
- **WHEN** a visitor views a long topic at 320px width
- **THEN** titles and summaries wrap without horizontal page overflow and actions remain visible and keyboard accessible
