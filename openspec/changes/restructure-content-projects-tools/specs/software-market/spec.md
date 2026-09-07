## ADDED Requirements

### Requirement: Download-oriented tool catalog
The Tools area SHALL prioritize downloadable macOS applications, CLIs, and plugins while treating browser utilities as a secondary tool type.

#### Scenario: Browse the software market
- **WHEN** a visitor opens Tools
- **THEN** each product exposes its type, platform, version, short purpose, and availability before any online-tool demonstration

### Requirement: Release-ready tool details
Each downloadable tool detail SHALL support screenshots, package type, version, file size, system requirements, release date, release notes, checksum, and a download action.

#### Scenario: Inspect a real release
- **WHEN** a tool has an available release and supplied download URL
- **THEN** the visitor can inspect release metadata and follow the direct download action

#### Scenario: Inspect a Demo release
- **WHEN** a Demo tool has no real package URL
- **THEN** the download action is disabled and clearly labeled as unavailable

### Requirement: Static and safe distribution boundary
The public web build SHALL render release metadata statically and SHALL NOT proxy, execute, or inspect downloaded binaries.

#### Scenario: Download an external package
- **WHEN** a visitor follows an available release link
- **THEN** the browser navigates directly to the configured release asset without sending the package through the InkBrain runtime
