# Open-source synthesis for Yugatn eWorld

Research snapshot: 2026-10-06.

## Projects worth studying

### WorkAdventure

WorkAdventure is the closest architectural reference for a persistent browser-based 2D social world: avatars, spatial interaction, customizable maps, proximity-based communication, and desktop/mobile/tablet support.

Use as a reference for:
- map/world representation;
- avatar presence;
- proximity interaction;
- mobile and tablet constraints;
- self-hosted deployment.

Do not copy its product model. eWorld differs by treating the user's apartment and its objects as a personal spatial interface.

### PixelHub

PixelHub is a compact Gather-style implementation using Phaser, Colyseus and LiveKit. Its useful ideas include server-authoritative movement, client prediction/interpolation, proximity chat and a shared TypeScript core.

Use as a reference for:
- authoritative multiplayer state;
- movement synchronization;
- proximity rules;
- validation and rate limiting;
- separating client/server/shared domain logic.

### Phaser + Colyseus tutorial

The official Colyseus Phaser tutorial is useful as the minimal reference for real-time rooms and WebSocket synchronization.

Use it as a learning/reference implementation, not as the final eWorld architecture.

### Nakama

Nakama provides an open-source backend for real-time multiplayer and social features.

Evaluate it later if eWorld needs:
- accounts and sessions;
- presence;
- friends;
- realtime synchronization;
- scalable backend services.

### SkyOffice / Social Block

These projects demonstrate Phaser + React + Colyseus + WebRTC patterns for interactive rooms, proximity chat, screen sharing and private rooms.

They are useful references for social interaction, but older implementations should be checked for current mobile support before adoption.

## What eWorld should take

eWorld should combine selected engineering patterns rather than become a clone.

### Layer 1 — Spatial client

2D rooms, avatar, objects, furniture, wardrobe and contextual capabilities.

### Layer 2 — Authoritative world state

For multiplayer deployment, the server becomes authoritative for:
- avatar position;
- room presence;
- object state;
- visits;
- ownership;
- interaction permissions.

The client may predict movement but must reconcile with authoritative state.

### Layer 3 — Social presence

Friends, visitors, proximity interaction, private apartments and explicit visit authorization.

### Layer 4 — Capability adapters

A virtual object is a spatial entry point into a service.

Examples:

- kitchen → food and grocery services;
- mailbox → Eugene Messenger;
- laptop → communication and work;
- television → video;
- music player → music;
- wardrobe → avatar appearance;
- workshop → apartment customization.

### Layer 5 — SymbiontOS boundary

SymbiontOS should remain the authorization/policy/event boundary rather than being embedded into the renderer.

eWorld emits versioned events and requests capabilities.

### Layer 6 — Eugene Messenger

Eugene owns communication semantics. eWorld provides the spatial interface.

A mailbox or laptop can therefore become an alternative UI for the same underlying Eugene conversation.

## Important difference from virtual-office projects

The central abstraction is not a workplace map.

It is:

**personal space → objects → contextual capabilities → services**

A user's apartment is therefore both:
- a social identity surface;
- a customizable home;
- an application launcher;
- a spatial interface to SymbiontOS/Eugene and future external services.

## Mobile-first consequences

The open-source comparison confirms that mobile/tablet support must be an architectural requirement rather than a later adaptation.

Required principles:
- Pointer Events;
- responsive viewport;
- touch-action control;
- large interaction targets;
- client-side prediction where appropriate;
- bounded rendering resolution;
- low-bandwidth synchronization;
- reconnect/offline state;
- graceful degradation for voice/video.

## Evidence status

**OBSERVED:** these open-source projects demonstrate viable patterns for browser-based 2D social worlds.

**DERIVED:** eWorld can reuse these architectural patterns while retaining its spatial-capability model.

**PROPOSED:** Phaser + authoritative realtime backend as a future production architecture.

**NOT_TESTED:** interoperability with SymbiontOS and Eugene.

**RESIDUAL:** licenses, current APIs, performance characteristics and mobile behavior must be checked before directly incorporating code or assets.
