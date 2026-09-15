## ADDED Requirements

### Requirement: Real topic exhibitions
The topic home SHALL render each knowledge entry as one exhibition in configured order, with its full title, summary and a link to its topic detail, without fabricating topics from article tags.

#### Scenario: Multiple topics
- **WHEN** several topics exist
- **THEN** each topic is shown once in configured order with alternating exhibition styling

### Requirement: Accurate content previews
Each exhibition SHALL count only references available in the public catalog, show counts by content type, and preview the first two available items in configured sequence.

#### Scenario: Mixed content
- **WHEN** a topic references articles, projects and tools
- **THEN** all available references contribute to totals and previews link to the correct public detail routes

#### Scenario: Empty or unavailable content
- **WHEN** no referenced content is publicly available
- **THEN** the topic remains visible with zero content and an organizing message rather than broken preview links

### Requirement: Responsive and accessible presentation
The exhibition home SHALL support both visual styles and both color modes, keyboard access, no-JavaScript reading and small screens without page overflow.

#### Scenario: Mobile and long titles
- **WHEN** the page is viewed on a narrow screen with long titles
- **THEN** titles wrap fully and each topic label precedes its content in a single-column view

#### Scenario: No topics
- **WHEN** the knowledge collection is empty
- **THEN** an honest empty state with a return-home link replaces the exhibitions
