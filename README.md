# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Accounts (local)

- **Account** button: create a named local identity, switch between saved accounts, or continue as Guest.
- Stable `subjectId` stored in the browser; no server password or OAuth in v0.1.
- Multiplayer display name follows the active session.

## Multiplayer & mobile

- **Multiplayer** button: room code, player list, room chat, emotes, invite link (`?room=`).
- Touch / narrow screens: virtual joystick + **E** interact; PWA manifest; safe-area insets.
- Requires `npm start` for WebSocket multiplayer.

## Furniture

- **E** in empty space → Inventory / furniture → place chair, plant, table, lamp near the avatar.
- Interact with placed furniture → pick up back to inventory.
- Persists in localStorage (world version 4).

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080`. Use Account to set your name, then Multiplayer to join a room.

```bash
npm test
npm run check
```

Controls: WASD / drag / joystick · **E** interact · **Esc** close panel.

## Status

Spatial loop + employment domain + realtime rooms/chat/presence/emotes + mobile controls + local furniture + local accounts.

Still boundaries: server auth, friends UI, shared furniture sync, media playback.

## Author

Югатн (Yugatn)
