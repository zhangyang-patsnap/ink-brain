## ADDED Requirements

### Requirement: Responsive editorial shell
The site SHALL provide a consistent header, main content region, and footer across public pages, with desktop navigation and an accessible compact navigation below 768px.

#### Scenario: Navigate on a desktop viewport
- **WHEN** a visitor opens any public page at or above 1024px wide
- **THEN** the primary navigation is visible on one line and the current section is identifiable

#### Scenario: Navigate on a mobile viewport
- **WHEN** a visitor opens any public page below 768px wide
- **THEN** content becomes single-column and all primary destinations remain reachable without horizontal scrolling

### Requirement: Theme preferences
The site SHALL support light and dark color tokens, default to the operating-system preference, and allow a visitor to persist a manual override.

#### Scenario: Restore a saved theme
- **WHEN** a visitor has previously selected a theme and reloads the site
- **THEN** the saved theme is applied before the main page content is painted

### Requirement: Discoverable homepage
The homepage SHALL introduce the author focus and provide direct paths to writing, knowledge, framework labs, and developer tools.

#### Scenario: First visit
- **WHEN** a visitor opens the root route
- **THEN** the primary value proposition and links to the four main content areas are visible within the initial viewport or its immediate continuation

### Requirement: Web metadata
The static build SHALL provide per-page titles and descriptions, canonical-ready metadata, a sitemap, and an RSS feed for published articles.

#### Scenario: Production build
- **WHEN** the web application is built for production
- **THEN** HTML metadata, sitemap output, and RSS output are generated without validation errors

### Requirement: Honest visit metric placeholder

The global footer SHALL present the phase-one cumulative visit metric as clearly labeled Demo data until a persistent analytics source is implemented.

#### Scenario: Inspect cumulative visits before analytics exists
- **WHEN** a visitor opens any public page in the static first release
- **THEN** the cumulative visit value is visible and cannot be mistaken for live analytics
