# Integration Contract v0.1

## Scope

This contract defines the boundary between Yugatn eWorld, SymbiontOS and Eugene Messenger.

## Event envelope

All cross-system events use the versioned envelope implemented in `src/integration/event-envelope.js`.

Required fields:

- event_id
- event_type
- schema_version
- actor_identity
- subject_scope
- timestamp
- payload
- provenance

Optional context:

- object_id
- world_id
- apartment_id
- correlation_id
- capability

## Ownership

### eWorld

Authoritative for:

- local spatial presentation;
- apartment layout;
- avatar appearance;
- object placement;
- transient interaction state.

### SymbiontOS

Authoritative integration boundary for:

- identity anchoring;
- capability authorization;
- policy decisions;
- event mediation;
- durable system-level provenance where configured.

### Eugene Messenger

Authoritative for:

- conversations;
- message content;
- delivery state;
- communication history.

## Message flow

A mailbox interaction creates an eWorld event. A future adapter requests the Eugene capability through the SymbiontOS boundary. Eugene performs the messaging operation. The result is returned as an event.

The browser must not pretend that the operation succeeded when the external service did not acknowledge it.

## Visit flow

A visitor request is a social-domain operation. Visual presence is not permission.

Recommended lifecycle:

`requested → authorized → started → ended`

A denied or expired request must not create visitor access.

## Synchronization

Every durable operation requires an acknowledgement or explicit failure state.

Duplicate events must be safely ignored using `event_id` or another idempotency key.

## Offline state

Transient local movement may continue while disconnected.

Durable communication, permissions and ownership changes must remain pending until acknowledged by their authoritative service.

## API status

No external HTTP/WebSocket endpoint is assumed by this contract.

Concrete endpoints must be added only after the actual SymbiontOS and Eugene transport contracts are verified.

## Evidence status

**IMPLEMENTED:** event envelope and local domain boundaries.

**PROPOSED:** cross-system transport contract.

**NOT_TESTED:** real SymbiontOS/Eugene synchronization.

**RESIDUAL:** external API schemas are not yet connected.
