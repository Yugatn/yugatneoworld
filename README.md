# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Multiplayer & mobile

- **Multiplayer** button in the HUD: display name, room code, player list, room chat, copy invite link.
- Share `?room=your-room` so others join the same space.
- On touch / narrow screens: virtual joystick + **E** interact FAB; safe-area insets; PWA manifest.
- Requires `npm start` for WebSocket multiplayer. Opening `index.html` alone stays local-only.

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

Spatial loop + employment domain + realtime rooms/chat/presence + mobile controls.

Still boundaries: accounts/auth, Eugene transport, media playback, furniture editor.

## Author

Югатн (Yugatn)
