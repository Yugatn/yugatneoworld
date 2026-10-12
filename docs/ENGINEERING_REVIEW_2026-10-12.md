# Engineering review — 2026-10-12

## Scope

Review of the current `main` snapshot for request handling, realtime input boundaries,
resource usage, project documentation, and validation. This is a source review plus
regression tests added on the hardening branch; it is not a penetration test or a
production-readiness certification.

## Changes in this branch

- **Proxy trust:** `X-Forwarded-For` is ignored by default. Set `TRUST_PROXY=true`
  only when a trusted reverse proxy removes client-supplied forwarding headers and
  writes its own value.
- **Connection-budget memory:** expired per-IP buckets are pruned opportunistically
  when the map reaches its bound; new unique keys are rejected if the map remains full.
- **Malformed URL encoding:** invalid percent-encoding returns HTTP 400 instead of
  throwing before the request handler's error boundary.
- **WebSocket envelope validation:** JSON `null`, arrays, and non-object payloads are
  ignored safely. The parser no longer truncates a message before JSON parsing; the
  WebSocket server's configured payload limit remains the size boundary.
- **Join coordinates:** initial avatar coordinates are clamped to the same world bounds
  used by movement updates.
- **Regression coverage:** smoke tests exercise malformed HTTP encoding and invalid
  WebSocket envelopes before verifying that ordinary multiplayer messages still work.

## Current architecture and limits

- **IMPLEMENTED:** a browser-based 2D world, in-memory realtime rooms, anonymous
  display profiles, transient keys, and a curated in-world anonymous-browser model.
- **IMPLEMENTED:** automated syntax and test validation on pushes and pull requests.
- **RESIDUAL:** browser-stored profiles are not server authentication. WebSocket
  connection IDs identify a connection, not a durable person.
- **RESIDUAL:** room, furniture, cinema, and key state is process-local and may be lost
  on restart. The prototype does not yet provide durable multi-device identity or
  production payment processing.
- **NOT_TESTED:** load capacity, multi-process behavior, persistence recovery, deployment
  proxy configuration, and an external security assessment.

## Priority next steps

1. **P0 — identity and authorization:** define a trusted login/identity proof before
   binding permissions, keys, money-like balances, or votes to a durable subject.
2. **P1 — realtime policy:** audit every WebSocket event for server-owned identity,
   room scoping, ownership checks, message-rate limits, and cleanup on disconnect.
3. **P1 — CI and dependencies:** keep syntax/tests mandatory; make high-severity
   dependency audit failures visible and actionable rather than silently ignored.
4. **P2 — persistence:** define schemas, migrations, retention, deletion, backup, and
   recovery before adding durable social or commerce features.
5. **P2 — operations:** add structured privacy-safe logs, metrics, alerting, load tests,
   and a documented deployment/proxy configuration.

## Deployment note

This branch is defense-in-depth for a prototype. Do not expose money-like or identity
features as production services until server-side authentication, authorization,
persistence, transport security, and operational controls are implemented and tested.
