# Security and trust boundaries

Last reviewed: 2026-10-11

## Current prototype boundaries

- **Local accounts are not authentication.** The account registry is stored in browser storage. It identifies a local profile on that browser; it does not prove control of an identity to another user or to a server.
- **Multiplayer identity is client-provided.** Names, avatars, room identifiers, movement, and interaction payloads received over WebSocket must be treated as untrusted input. Server-side validation is required even when the UI validates the same fields.
- **In-memory multiplayer state is ephemeral.** Room membership, presence, cinema state, furniture state, and temporary keys held by the process are not a durable database.
- **Commerce is a simulation.** Catalog prices and delivery transitions are prototype state, not payment processing, a real courier integration, or a binding order with a real vendor.
- **Do not store secrets in the client.** Browser storage and frontend bundles are inspectable by the person using the browser. Do not place passwords, API keys, private tokens, or payment credentials there.

## Before public production deployment

1. Add real server-side authentication and bind every privileged operation to the authenticated subject, not a client-supplied display name or subject ID.
2. Authorize room entry, visits, key grants/revocations, furniture changes, and media actions on the server for every request.
3. Add message schema validation, payload-size limits, per-connection rate limits, and connection/resource limits.
4. Review HTTP path resolution, response security headers, origin policy, WebSocket abuse cases, and dependency updates.
5. Persist only the state that needs persistence; define ownership, retention, export, and deletion behavior.
6. Add integration tests for malformed messages, unauthorized actions, reconnects, room transitions, and resource cleanup.

## Reporting

Until a private security contact is configured in the repository, do not include secrets or personal data in public issues. Report reproducible security problems with a minimal sanitized example.
