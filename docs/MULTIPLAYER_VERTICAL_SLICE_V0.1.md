# Multiplayer Vertical Slice v0.1+

## Implemented

- WebSocket realtime server with room membership
- Display name + room code UI
- Invite link (`?room=`)
- Presence counter and player list
- Room chat (rate-limited)
- Emotes (wave/heart/clap/think/hello) with speech bubbles + toast
- Avatar colors, scene-aware remote rendering
- Profile update, scene change, invite, proximity events
- Reconnect with backoff
- Mobile joystick + interact FAB
- PWA manifest + safe-area layout
- WebSocket smoke test in CI (chat + emote)

## Furniture (local)

- Inventory with chair / plant / table / lamp
- Place next to avatar; pick up via object interaction
- Persisted in localStorage (not yet shared across clients)

## Acceptance

1. `npm start` → two browsers on `http://localhost:8080`
2. Same room code → both in presence list
3. Move / chat / emote visible across clients
4. Phone-width: joystick + E interact
5. Inventory place/pick works offline and persists after reload

## Not complete

- Accounts / auth
- Authoritative collision
- Persistent chat history
- Shared furniture sync over WebSocket
- Production TLS deployment
