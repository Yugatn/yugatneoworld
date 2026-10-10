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

## Acceptance

1. `npm start` → open two browsers on `http://localhost:8080`
2. Set the same room code → both appear in presence list
3. Move on client A → client B sees motion
4. Send chat → both see message
5. On a phone-width viewport, joystick moves the avatar and E interacts

## Not complete

- Accounts / auth
- Authoritative collision
- Persistent chat history
- Production TLS deployment
