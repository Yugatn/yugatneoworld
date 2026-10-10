# Multiplayer Vertical Slice v0.1+

## Implemented

- WebSocket realtime server with room membership
- Display name + room code UI
- Invite link (`?room=`)
- Presence counter and player list
- Room chat (rate-limited)
- Avatar colors, scene-aware remote rendering
- Profile update, scene change, invite, proximity events
- Reconnect with backoff
- Mobile joystick + interact FAB
- PWA manifest + safe-area layout
- Emotes (wave/heart/clap/think/hello)
- Speech bubbles + toast when panel closed
- WebSocket smoke test in CI

## Acceptance

1. `npm start` → two browsers on `http://localhost:8080`
2. Same room code → both in presence list
3. Move / chat / emote visible across clients
4. Phone-width: joystick + E interact

## Not complete

- Accounts / auth
- Authoritative collision
- Persistent chat history
- Production TLS deployment
