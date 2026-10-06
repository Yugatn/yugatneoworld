# Yugatn eWorld — SymbiontOS and Eugene Integration

## Purpose

Yugatn eWorld is the spatial social interface. SymbiontOS is the system-level event, identity, policy and agent layer. Eugene Messenger is the communication application layer.

The three systems must remain modular while sharing explicit contracts.

## Architectural boundary

```text
Yugatn eWorld
  2D World / Avatar / Apartment / Objects
             |
             | World Interaction Events
             v
      SymbiontOS Event Fabric
       Identity / Policy / EventLog
             |
       +-----+------+
       |            |
       v            v
 Eugene Messenger  Other Symbiont Services
```

## eWorld as presentation layer

The eWorld client owns:

- rendering;
- avatar movement;
- room and object state;
- interaction detection;
- local UI state;
- accessibility fallback.

It should not become the authority for identity, permissions, message delivery or durable event history.

## SymbiontOS responsibilities

SymbiontOS provides the integration boundary for:

- IdentityAnchor;
- Event Fabric / Symbiont Mediator;
- EventLog;
- ContextReducer;
- PolicyEngine;
- Transport;
- capability and permission checks;
- provenance and evidence metadata where required.

The eWorld client requests capabilities rather than directly bypassing policy.

## Eugene Messenger responsibilities

Eugene remains the communication service/application. eWorld presents Eugene capabilities through spatial objects.

Examples:

`Mailbox → Eugene inbox`

`Mailbox → compose Eugene message`

`Laptop → Eugene conversations`

`Friend avatar → Eugene conversation / contact view`

The mailbox is therefore an interface to messaging, not the authoritative message store.

## Event contract

The initial integration event envelope should be versioned and minimal:

```text
EventEnvelope
  event_id
  event_type
  schema_version
  actor_identity
  subject_scope
  object_id?
  world_id?
  apartment_id?
  timestamp
  correlation_id?
  capability?
  payload
  provenance
```

Suggested events:

- `world.session.started`
- `avatar.moved`
- `object.entered_interaction_range`
- `object.interacted`
- `mailbox.opened`
- `message.compose.requested`
- `message.sent`
- `message.received`
- `friendship.requested`
- `friendship.accepted`
- `apartment.visit.requested`
- `apartment.visit.authorized`
- `apartment.visit.started`
- `apartment.visit.ended`
- `avatar.appearance.changed`
- `inventory.item.placed`
- `inventory.item.removed`
- `media.play.requested`
- `media.play.started`
- `media.play.stopped`

## Synchronization model

Use event-driven synchronization rather than making every system write the same state.

The authoritative owner of each state must be explicit.

Examples:

| State | Authority |
|---|---|
| Avatar render position | eWorld session, optionally synchronized |
| Durable identity | SymbiontOS identity layer |
| Message state | Eugene Messenger |
| Permission/policy | SymbiontOS PolicyEngine |
| Apartment layout | eWorld domain/persistence |
| Inventory ownership | eWorld domain/economy service |
| Evidence/provenance | SymbiontOS / Evidence Ledger |

## Idempotency

Every externally processed event must support deduplication by `event_id` or equivalent idempotency key.

Repeated delivery must not send the same message twice, grant a visit twice or duplicate an inventory operation.

## Offline and reconnect

The client should tolerate temporary disconnection.

Local transient state may be queued, but durable server-side actions require acknowledgement. On reconnect, events are reconciled using IDs and version information rather than blind replay.

## Identity

Do not use avatar appearance as identity.

```text
Subject/User Identity
        ≠
Avatar Appearance
        ≠
Session
        ≠
Device
```

This is compatible with the SymbiontOS IdentityAnchor concept.

## Permission model

A visitor's visual presence does not imply access to every object.

Example capability scopes:

- `apartment.visit`
- `apartment.view`
- `object.interact`
- `media.play`
- `message.send`
- `message.read`
- `inventory.edit`
- `avatar.edit`

Permissions are evaluated by the policy authority before consequential actions.

## Safety and governance

The integration inherits the SymbiontOS principle that authorization is distinct from evidence and that a client-side interaction is not itself proof of authorization.

The Law of Development and existing SymbiontOS safety boundaries remain upstream of consequential agent behavior.

## Agent integration

Future agents may subscribe to world events through SymbiontOS rather than directly modifying the world.

A safe pattern is:

`World Event → Event Fabric → Agent Proposal → Policy Check → Authorized Action → World Event`

Agents must not silently take control of a user's avatar, communications or private apartment.

## First integration milestone

Build a local adapter with three working paths:

1. `Mailbox → Eugene Messenger inbox`;
2. `Mailbox → Eugene compose/send`;
3. `Friend avatar → Eugene conversation`.

Then add event synchronization and reconnect handling.

## Status

**Architecture:** PROPOSED  
**Integration implementation:** NOT_TESTED  
**External Eugene API contract:** NOT_SPECIFIED  
**SymbiontOS transport contract:** NOT_SPECIFIED

Until concrete APIs are available, adapters must remain behind interfaces and must not invent network endpoints.
