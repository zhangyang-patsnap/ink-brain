## ADDED Requirements

### Requirement: Unique-visitor deduplication
The backend SHALL count a visitor as unique per UTC calendar day using a hash of the request's client IP and User-Agent, without cookies or client-side dedup logic, and SHALL never persist the IP, User-Agent, or hash to disk — only aggregate counts.

#### Scenario: Same visitor refreshes a page
- **WHEN** the same client IP and User-Agent issue two GET requests for the same public HTML page within the same UTC day
- **THEN** the site's cumulative visitor total increases by exactly one, not two

#### Scenario: Distinct visitors
- **WHEN** two GET requests arrive with either a different client IP or a different User-Agent
- **THEN** both are counted as separate visitors

#### Scenario: Day rollover
- **WHEN** the server's observed UTC calendar day changes
- **THEN** deduplication state resets so a previously-counted visitor may be counted again that day, while the cumulative totals persisted from prior days are not reset

### Requirement: Non-visit traffic is excluded
The backend SHALL exclude non-GET requests, requests with an empty or bot-like User-Agent, non-200 responses, and non-HTML responses from all visitor counts.

#### Scenario: Bot or scripted User-Agent
- **WHEN** a GET request's User-Agent matches a known bot/crawler/scripting pattern or is empty
- **THEN** the request is not counted toward the site total or any article's count

#### Scenario: Fabricated article address
- **WHEN** a GET request targets `/writing/<id>/` for an id that does not correspond to a published article
- **THEN** the response is a 404 and the request is not counted toward that or any article's count

### Requirement: Per-article unique reader count
The backend SHALL additionally attribute a deduplicated visit to the specific article whose detail page was requested, using the same per-day IP+User-Agent deduplication as the site total.

#### Scenario: Repeated reads of one article
- **WHEN** the same visitor requests the same article's detail page more than once within a UTC day
- **THEN** that article's unique reader count increases by exactly one for that day

### Requirement: Real-time public read API
The backend SHALL expose unauthenticated, side-effect-free GET endpoints for the current cumulative visitor total and for one or more articles' unique reader counts, each responding with `Cache-Control: no-store`, and the visitor site SHALL fetch and display these numbers at runtime rather than baking them into the published build.

#### Scenario: Reading the site total
- **WHEN** a client issues `GET /api/stats/summary`
- **THEN** the response is 200 with the current cumulative unique visitor count and no caching

#### Scenario: Reading article counts in bulk
- **WHEN** a client issues `GET /api/stats/articles?ids=a,b,c` with a mix of valid known ids, invalid ids, and unknown ids
- **THEN** the response is 200, includes a count (zero for unknown ids) for every syntactically valid id, and silently omits or ignores invalid ids rather than failing the whole request

#### Scenario: Footer displays a real number
- **WHEN** a visitor loads any page of the published site
- **THEN** the footer shows the current cumulative unique-visitor count fetched from the API, with no demo/placeholder label

### Requirement: Optional, narrowly-scoped proxy trust
The backend SHALL, by default, determine the client IP from the raw connection address only. An operator MAY opt in via a dedicated configuration flag to trust the last entry of the `X-Forwarded-For` header as the client IP for visitor analytics specifically, and this opt-in SHALL NOT alter the IP source used by any other security-sensitive feature such as login rate limiting.

#### Scenario: Proxy trust disabled (default)
- **WHEN** the proxy-trust flag is not enabled
- **THEN** visitor analytics uses the raw socket address as the client IP regardless of any `X-Forwarded-For` header present on the request

#### Scenario: Proxy trust enabled
- **WHEN** the proxy-trust flag is enabled and a request carries a comma-separated `X-Forwarded-For` header
- **THEN** visitor analytics uses the last entry in that header as the client IP, not the first (client-controlled) entry
