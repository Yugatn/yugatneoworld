# Security boundaries and current limits

Status: implementation snapshot for the realtime prototype.

## Implemented controls

- The static HTTP server accepts only `GET` and `HEAD`.
- Public files are allowlisted: the application entry points and browser assets under `src/`. Server code, package metadata, tests, and internal documentation are not intended to be served.
- Responses include baseline browser security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a restrictive Content Security Policy.
- WebSocket messages are limited to 16 KiB; per-message compression is disabled.
- Each WebSocket connection has a token bucket with a burst capacity of 180 messages and refill rate of 60 messages/second. Exceeding the available budget closes the connection with code 1008.
- Server limits are 200 concurrent connections, 500 rooms, and 50 members per room.
- Avatar coordinates are clamped server-side.
- Chat and emotes have additional event-specific cooldowns.
- Furniture placement derives `roomId` and `ownerId` from server-side connection context, ignoring client-supplied values for those fields.
- Furniture capability labels are allowlisted; arbitrary client-supplied labels such as `admin` are discarded.
- Furniture removal is restricted to the connection that placed the item.
- Transient keys are removed when the host disconnects; guest references and expired keys are cleaned from other hosts' key lists on disconnect.

## Session primitive added (not yet wired to WebSocket authentication)

- `server/session-registry.js` creates opaque 256-bit bearer tokens and stores only SHA-256 token digests in an in-memory registry.
- Verification returns the server-owned subject ID and timestamps, never the bearer token.
- Sessions have bounded TTLs, explicit revocation, and expired-entry pruning.
- Unit tests cover successful verification, unknown tokens, expiry, revocation, invalid subject IDs, and TTL bounds.
- The registry is deliberately not exposed as a public client-controlled issuance endpoint. Its `create()` method must only be called after a trusted authentication step.
- The registry is process-local; restart invalidates sessions. Until an actual authentication flow is implemented and the WebSocket handshake/message path verifies credentials, this primitive does not authenticate peers.

## Explicit non-goals / residual risks

These controls are defense-in-depth, not production-grade identity or authorization.

- Account identities currently live in browser storage. The realtime server assigns a fresh connection ID and does not authenticate a stable `subjectId`.
- A connection ID is not proof of a person's identity and changes after reconnecting.
- Room state, furniture, cinema contributions, and keys are in memory and can be lost on server restart.
- The current visit/key model is an MVP: keys are transient and scoped to peers currently represented by server connections. It is not suitable for claiming durable cross-device permissions.
- Resource limits have not been established through load testing; production limits must be measured against memory, CPU, network, and expected traffic.
- A restrictive Content Security Policy may need explicit updates if trusted external assets or integrations are introduced. Do not weaken it globally to make an integration work without reviewing the source.
- No real payment, media-streaming, external account, or SymbiontOS/Eugene authorization endpoint is implied by the prototype.

## Required before public production

1. Add server-verified authentication and short-lived session credentials.
2. Authorize actions against a stable server-owned subject identity and explicit apartment/object capabilities.
3. Persist durable account, room, inventory, ownership, and permission state in a database with migrations and backups.
4. Add abuse monitoring, operational metrics, structured logs with privacy safeguards, and load tests.
5. Define privacy retention, account deletion, moderation, recovery, and incident-response procedures.

## Evidence labels

- **IMPLEMENTED:** controls listed under “Implemented controls” are present in the current server code.
- **NOT_TESTED:** production load, multi-process behavior, persistence recovery, and real identity-provider integration.
- **RESIDUAL:** connection IDs remain ephemeral and are not authentication.
