## ADDED Requirements

### Requirement: Tools directory
The site SHALL provide a discoverable tools page that distinguishes available browser-local tools from planned server-backed tools.

#### Scenario: Browse tools
- **WHEN** a visitor opens the tools route
- **THEN** available tools are actionable and planned tools cannot be mistaken for working functionality

### Requirement: JSON formatter demonstration
The first release SHALL provide a polished JSON formatter interface demonstration without claiming that formatting actions are implemented.

#### Scenario: Inspect the formatter demonstration
- **WHEN** a visitor opens the tools route
- **THEN** the input, output, action, empty, and error-state presentation is visible as representative UI and every unavailable action is clearly identified as a demo
