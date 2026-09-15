## ADDED Requirements

### Requirement: Real project card catalog
The project homepage SHALL display a selector for each configured project, preserving order, name, description, status and demo label, alongside the selected project's full detail. Existing detail URLs SHALL remain available as a no-JavaScript fallback.

#### Scenario: Variable project count
- **WHEN** zero, one, odd or even numbers of projects exist
- **THEN** the page shows an honest empty state or complete responsive cards without fabricated projects or blank filler cells

### Requirement: Inline C project detail
The homepage SHALL use two equal-width desktop panels: a complete left C-style project showcase and the right selected project's detail. The showcase SHALL contain its introductory hero, horizontal type filters, a full-width accent lead card and a two-column grid of remaining cards. It SHALL support a collapsible showcase on mobile.

#### Scenario: Reference structure
- **WHEN** a project is displayed
- **THEN** a tinted hero contains category, title, adjacent subtitle/status, resource actions and upper-right ruled note; a four-column facts strip precedes introduction, capabilities and README headings with a narrow right directory

#### Scenario: Maintainable optional facts
- **WHEN** the author edits a project
- **THEN** optional license and languages can be saved and published; missing facts are explicitly unavailable and are never inferred

#### Scenario: Category selection
- **WHEN** a visitor selects a project type
- **THEN** matching projects retain their relative order and the first visible project is selected if the current project is excluded; without JavaScript all project links remain usable

#### Scenario: Selection and navigation
- **WHEN** a visitor selects a project, reloads, or uses browser history
- **THEN** the selected project's full content is shown without leaving the homepage, the project query parameter identifies it, and only one active set of directory anchors and diagrams is mounted

### Requirement: Project resources and documentation
The detail page SHALL show real project introduction, status, stack, optional deployment link, all configured valid repository/documentation links, capabilities and sanitized README content.

#### Scenario: Optional resources
- **WHEN** project addresses are blank, duplicated or unsupported schemes
- **THEN** no invalid link or fake deployment action is rendered; missing resource groups use disabled labeled placeholders, and valid multi-address and legacy single-address entries are supported

#### Scenario: Missing README
- **WHEN** documentation is empty
- **THEN** the page indicates that README has not been provided without adding sample instructions

### Requirement: Readable navigable README
The page SHALL provide a wide readable README, static heading anchors and a right-side desktop directory that becomes a compact mobile disclosure, using existing style/color themes.

#### Scenario: Complex Markdown
- **WHEN** README contains repeated headings, code, tables, images or Mermaid
- **THEN** anchors are unique, text is sanitized, wide elements do not overflow the page and existing Mermaid rendering remains available

#### Scenario: Keyboard and no JavaScript
- **WHEN** a visitor uses keyboard navigation or disables JavaScript
- **THEN** card/resource links and README table-of-contents anchors remain usable and focus is visible
