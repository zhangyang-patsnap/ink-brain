## ADDED Requirements

### Requirement: Controlled article categories
Each published article SHALL have exactly one category selected from a centralized typed category catalog.

#### Scenario: Browse writing categories
- **WHEN** a visitor opens the writing index
- **THEN** the available categories and their article counts are visible before the article list

### Requirement: Article tags and series
Articles SHALL support reusable tags and an optional series identifier without replacing the primary category.

#### Scenario: Inspect article metadata
- **WHEN** a visitor opens an article detail page
- **THEN** its category, tags, and optional series context are presented with stable browse links

### Requirement: Static taxonomy routes
The static build SHALL generate category and tag routes from repository-owned content.

#### Scenario: Open a taxonomy route
- **WHEN** a visitor follows a category or tag link
- **THEN** the site renders only matching published articles and provides a route back to all writing
