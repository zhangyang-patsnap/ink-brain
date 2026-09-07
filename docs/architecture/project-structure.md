# Project structure

InkBrain separates publishing, runtime execution, and future platform orchestration.

```text
browser
  -> apps/web                 static pages and browser-local tools
  -> platform API            future authenticated control plane
       -> labs/*              independent framework processes
```

The current release implements only `apps/web` and the Lab contract. A Lab folder is not a running service unless its own README includes a verified start command and its manifest status is `available`.

## Runtime ownership

- Astro owns rendering, content validation, metadata, and browser-local tools.
- A future Java platform API will own credentials, quotas, persistence, and run lifecycle.
- Python packages will host ecosystem-native framework experiments.
- Java packages will host Spring AI and enterprise integration experiments.
- Rust packages will host low-level runtime, event, and performance experiments.

## Terminal truth

When remote runs are implemented, HTTP acceptance is not completion. A run is terminal only after the event stream reports `run.completed`, `run.failed`, or `run.cancelled`.
