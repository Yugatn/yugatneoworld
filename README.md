# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Multiplayer & mobile

- **Multiplayer** button in the HUD: display name, room code, player list, room chat, emotes, copy invite link.
- Share `?room=your-room` so others join the same space.
- On touch / narrow screens: virtual joystick + **E** interact FAB; safe-area insets; PWA manifest.
- Requires `npm start` for WebSocket multiplayer. Opening `index.html` alone stays local-only.

## Furniture

- Press **E** away from objects (or open room capabilities) → **Inventory / furniture**.
- Place chair, plant, table, or lamp next to your avatar; interact with placed items to pick them back up.
- Placement is saved in localStorage with the world state.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080` in two browsers with the same room code.

```bash
npm test
npm run check
```

Controls: WASD / drag / joystick · **E** interact · **Esc** close panel or leave street.

## Status

Spatial loop + employment domain + realtime rooms/chat/presence/emotes + mobile controls + furniture place/pick.

Still boundaries: accounts/auth, Eugene transport, media playback, shared furniture sync.

## Author

Югатн (Yugatn)
