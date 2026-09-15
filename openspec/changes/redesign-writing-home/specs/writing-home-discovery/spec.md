## ADDED Requirements

### Requirement: Editorial article discovery
The writing home SHALL show a compact introduction, the latest published article as a lead, and the remaining published articles in descending date order without category groups or duplicate visible entries.

#### Scenario: Several articles
- **WHEN** multiple published articles exist
- **THEN** one lead and a two-column remaining list are rendered with working detail links; drafts are excluded

#### Scenario: Zero or one article
- **WHEN** zero or one article is published
- **THEN** the page respectively shows an empty-state message or only the lead, without empty list decoration

### Requirement: Local search
The home SHALL search all published titles and summaries locally, including the lead article, and expose result count and a clear action.

#### Scenario: Search and clear
- **WHEN** a query is entered then cleared
- **THEN** matching articles appear once in a result grid and clearing restores the original lead and remaining list

#### Scenario: No match
- **WHEN** the query matches no article
- **THEN** the page displays zero results and a clear-search action without modifying content

#### Scenario: JavaScript disabled
- **WHEN** JavaScript is unavailable
- **THEN** articles and links remain visible and nonfunctional search controls are not shown

### Requirement: Responsive visual consistency
The home SHALL respect paper/workbench and light/dark preferences, support keyboard operation, and use a single-column layout on small screens.

#### Scenario: Mobile and theme changes
- **WHEN** the reader switches style or color mode on desktop or mobile
- **THEN** the search state and content remain intact with no page-level horizontal overflow
