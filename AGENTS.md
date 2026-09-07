# InkBrain contributor guidance

## Product boundaries

- Treat InkBrain as a technical publication, knowledge map, framework lab catalog, and developer toolbox.
- Keep the public web build static-first until a feature needs persistence, secrets, or long-running execution.
- Never present a planned Lab as live or verified.
- Keep framework runtimes independent. The web application must not import Lab implementation code.

## Content quality

- Distinguish ideas, studied concepts, implemented work, verified experiments, and production evidence.
- Prefer source code, tests, traces, failure cases, and measurable evidence over promotional claims.
- Use concise Chinese copy for reader-facing content and English identifiers in code and protocols.
- Add related content identifiers so articles, knowledge nodes, frameworks, and experiments form a navigable graph.

## Engineering

- Preserve strict TypeScript and content schema validation.
- Keep browser-local tools local. Document any future server transmission clearly.
- Support keyboard navigation, reduced motion, responsive layouts, and light and dark themes.
- Use `rg` for narrow lookup. Use Graphify for broad architecture or cross-file flow analysis, not simple edits or exact symbol searches.

## Change workflow

- Use OpenSpec for meaningful capabilities and architectural changes.
- Update the active change task immediately after its implementation is verified.
- Do not archive an OpenSpec change until implementation and validation are complete.
