## ADDED Requirements

### Requirement: Unified tools showcase
The tools homepage SHALL exclude web-tool records before rendering and render each remaining tool once in data order using a full-width featured background card followed by a three-column tinted card grid on desktop. It SHALL NOT include separate More Tools or Browser Utilities sections. Existing records and detail routes SHALL remain unchanged.

#### Scenario: Four tools
- **WHEN** four non-web tools are supplied
- **THEN** the first is a full-width card and the next three share one equal-width row, each with its name, summary, category, availability, platform and existing detail link

#### Scenario: Honest availability
- **WHEN** demo, available or retired tools are rendered
- **THEN** their true states remain visible, no fictitious download action is added, and a demo-only catalog states downloads are not open

### Requirement: Local category and search filtering
The homepage SHALL offer All, Desktop, CLI and Plugin filters and local keyword search. Web tools SHALL NOT appear in filters, results or counts, including without JavaScript. Filters SHALL intersect, preserve source order and feature the first visible item. Search SHALL normalize Unicode width and case, match all query terms, and defer updates during IME composition.

#### Scenario: Combined query
- **WHEN** a reader selects CLI and searches a matching name or platform
- **THEN** only matching CLI tools are shown and the result count updates

#### Scenario: No matches
- **WHEN** no tools match
- **THEN** an empty-result message and clear-filters action appear without changing the reader's selection automatically

### Requirement: Accessible responsive reading
The showcase SHALL support keyboard controls, visible focus, named search, announced result counts, both site styles in light and dark, and mobile layouts without horizontal page overflow.

#### Scenario: Small screen
- **WHEN** the viewport is 320 CSS pixels wide
- **THEN** cards stack in a readable single column and long content wraps within the page

#### Scenario: Script unavailable or catalog empty
- **WHEN** JavaScript is unavailable
- **THEN** all existing tool detail links remain readable and working without nonfunctional filter controls
- **WHEN** the catalog has no tools
- **THEN** a truthful catalog-empty message is shown instead of a fabricated featured tool
