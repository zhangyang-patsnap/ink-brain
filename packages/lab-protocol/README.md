# InkBrain Lab protocol

Framework Labs run independently and expose a common transport boundary.

## Required endpoints

```text
GET  /health
GET  /meta
POST /runs
GET  /runs/{runId}
GET  /runs/{runId}/events
POST /runs/{runId}/cancel
```

`POST /runs` accepts a predefined scenario identifier and structured input. It must not accept arbitrary source code in public deployments.

The events endpoint uses Server-Sent Events. Terminal event types are:

- `run.completed`
- `run.failed`
- `run.cancelled`

An HTTP success response or a closed stream is not proof of successful completion.

## Manifest

Each Lab owns a `lab.yaml` with its identifier, language, framework, status, port, capabilities, and start command. `planned` and `documented` manifests are catalog metadata, not availability claims.
