## ADDED Requirements

### Requirement: Framework catalog
The site SHALL list the initial AI framework tracks with language, focus, status, capabilities, and a stable detail route.

#### Scenario: Compare framework tracks
- **WHEN** a visitor opens the framework catalog
- **THEN** CrewAI, PydanticAI, LangGraph, Spring AI, and a Rust runtime track can be compared without starting any Lab process

### Requirement: Framework detail
Each framework detail page SHALL describe its position, core concepts, planned experiments, runtime boundary, and related content.

#### Scenario: Inspect one framework
- **WHEN** a visitor opens a valid framework route
- **THEN** the page renders the framework metadata and makes its current runtime availability explicit

### Requirement: Independent Lab contract
The repository SHALL document a language-neutral Lab contract covering metadata, health, run creation, server-sent events, result lookup, and cancellation.

#### Scenario: Add a future Lab
- **WHEN** a contributor implements a new independent Lab
- **THEN** its directory has enough protocol and manifest guidance to integrate without importing code into the web application
