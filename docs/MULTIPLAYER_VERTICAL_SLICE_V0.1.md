# Multiplayer Vertical Slice v0.1

## Goal

Establish the first real-time social world slice before expanding the service ecosystem.

## Implemented

- WebSocket realtime server.
- Authoritative room membership.
- Multiple clients can join the same apartment room.
- Server assigns a connection identity.
- Room snapshots synchronize existing occupants.
- Join and leave events propagate.
- Avatar position updates propagate between clients.
- Browser realtime adapter.
- Invite message transport.
- Proximity interaction event transport.

## Current integration boundary

The existing 2D renderer remains the presentation layer. The realtime layer is deliberately separated from world-domain logic.

The next renderer migration can use Phaser without changing:
- room protocol;
- event envelope;
- Eugene adapter;
- SymbiontOS boundary;
- spatial capability model.

## Not yet complete

- persistent accounts;
- authenticated identity;
- authoritative collision;
- server-side anti-cheat movement validation;
- invitation UI;
- remote avatar rendering in the current canvas;
- Eugene transport;
- real commerce connector;
- production TLS/deployment;
- automated multiplayer integration tests.

## Acceptance criteria

1. Start the server.
2. Open two browser clients.
3. Both join apartment:demo.
4. Both clients receive the other client's presence.
5. Moving client A emits an authoritative position update.
6. Client B receives that update.
7. Leaving client A removes its presence from client B.

## Evidence status

IMPLEMENTED: realtime transport and room state.

NOT_TESTED: end-to-end browser multiplayer run in this environment.

PROPOSED: Phaser migration after protocol stabilization.
