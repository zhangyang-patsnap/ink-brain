## ADDED Requirements

### Requirement: Owned project catalog
The site SHALL provide a Projects catalog for self-developed frameworks, applications, and libraries, separate from third-party framework study.

#### Scenario: Discover an owned Agent framework
- **WHEN** a visitor opens Projects
- **THEN** a representative self-developed Agent framework is presented as an owned project rather than a Framework Lab

### Requirement: Project detail evidence
Each project detail page SHALL expose its type, status, positioning, technology stack, capabilities, current evidence, documentation state, and related content.

#### Scenario: Project is still a Demo
- **WHEN** a project lacks a real repository, release, or verified evidence
- **THEN** unavailable actions are disabled or omitted and the Demo status is explicit

### Requirement: Canonical project relationships
An owned project SHALL have one canonical project page while related articles, knowledge topics, Labs, and tools link back to it.

#### Scenario: Traverse project context
- **WHEN** a visitor follows a related artifact from a project page
- **THEN** they reach that artifact's canonical domain without duplicated project records
