## ADDED Requirements

### Requirement: Standalone guestbook
The website SHALL expose a standalone guestbook after About in desktop and mobile navigation, without article comment sections.

#### Scenario: Visitor opens guestbook
- **WHEN** a visitor follows the 留言 navigation item
- **THEN** `/guestbook/` displays a submission form and a paginated public message list with loading, empty and error states

### Requirement: Moderated public submission
The server MUST validate nickname and plain-text body, enforce bounded request size, trusted origin and submission rate limits, and store every submission as pending independently from publication.

#### Scenario: Anonymous submission
- **WHEN** a visitor submits a valid nickname and message
- **THEN** the server persists a pending message and the page explains that approval is required

#### Scenario: Public filtering
- **WHEN** a visitor reads messages with any supplied status parameters
- **THEN** only approved messages and public fields are returned

#### Scenario: Invalid or excessive submission
- **WHEN** a visitor submits invalid fields, untrusted origin or exceeds rate limits
- **THEN** the request is rejected without storing a message

### Requirement: Author moderation
The server MUST restrict listing private messages and changing status to authenticated author sessions; mutations MUST also pass origin and CSRF validation.

#### Scenario: Approve and hide
- **WHEN** an authenticated author approves a pending message
- **THEN** it becomes publicly visible without a site rebuild and can later be hidden or rejected

#### Scenario: Unauthorized moderation
- **WHEN** an unauthenticated request or a mutation without valid CSRF attempts moderation
- **THEN** access is denied and the message is unchanged

### Requirement: Durable and safe messages
Messages MUST persist across restarts, be isolated from content releases, and render as text in both public and administrator interfaces.

#### Scenario: Script-like input
- **WHEN** a message contains HTML or script markup
- **THEN** it is displayed as literal text without executing code

### Requirement: Visitor visibility choice
The form SHALL offer 公开 and 不公开, defaulting to 公开. Public API results MUST require both approved status and public visibility. Moderation MUST NOT alter visibility.

#### Scenario: Private message approved
- **WHEN** a visitor selects 不公开 and an author approves the message
- **THEN** the message remains visible only in the administrator interface

#### Scenario: Existing messages
- **WHEN** the database is upgraded from the original schema
- **THEN** existing messages retain public visibility and their original moderation status

### Requirement: Author reply and deletion
The administrator SHALL be able to save, edit and clear a plain-text reply, and delete a message after confirmation. Both APIs MUST require author authentication, origin and CSRF checks.

#### Scenario: Reply visibility
- **WHEN** an author saves a reply
- **THEN** it is publicly readable only if the parent message is approved and public; private and pending messages remain nonpublic

#### Scenario: Delete message
- **WHEN** an author confirms deletion
- **THEN** both message and reply are removed from storage and subsequent public and admin reads

### Requirement: Persistent administrator overview
The administrator list SHALL default to all messages, with status badges and optional status filters. Moderation SHALL NOT remove a message from the default list.

#### Scenario: Approve in all messages
- **WHEN** an administrator approves a message in the default view
- **THEN** the same message remains visible with its updated status until manually deleted
