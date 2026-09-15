## ADDED Requirements

### Requirement: Independent visitor style selection
The visitor site SHALL offer paper (纸上) and workbench (阅读工作台) using a single icon button at the upper right, independently of light/dark mode.

#### Scenario: Toggle styles
- **WHEN** a visitor activates the style button by pointer or keyboard
- **THEN** the style changes without changing content or light/dark mode, and the button label identifies the current and next styles

### Requirement: Persistent and resilient preference
The site SHALL restore a valid stored style before first paint, default to paper, and remain usable when storage is unavailable.

#### Scenario: Reload and navigation
- **WHEN** a visitor selects workbench then reloads or navigates to another visitor page
- **THEN** workbench remains selected

#### Scenario: Unavailable or invalid storage
- **WHEN** storage access fails or the stored style is invalid
- **THEN** the page defaults to paper and style switching remains functional

### Requirement: Responsive workbench reading layout
The workbench SHALL use a distinct surface, compact sans-serif reading typography, and a right-side desktop table of contents while preserving existing content and image enlargement.

#### Scenario: Desktop and mobile reading
- **WHEN** an article is viewed in either light or dark workbench style
- **THEN** desktop shows a document panel and right-side directory, mobile uses the existing collapsible directory, and neither produces page-level horizontal overflow

#### Scenario: Restore paper
- **WHEN** the visitor switches back to paper
- **THEN** the original paper colors, typography, and article layout are restored
