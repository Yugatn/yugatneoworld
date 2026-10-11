# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Accounts (local)

- **Account** button: create a named local identity, switch between saved accounts, or continue as Guest.
- Stable `subjectId` stored in the browser; no server password or OAuth in v0.1.
- Multiplayer display name follows the active session.

## Avatar — appearance & care

- **Base look**: body, skin, hair style/color, facial hair.
- **Clothing**: wardrobe (top / bottom / shoes / accessory); equip only owned items.
- **Temporary effects**: fresh shave, new haircut, wet hair, dressed up (TTL).
- **Shave at home**: mirror or bathroom sink in the bedroom.
- **Haircut in the city**: Barbershop on the street (permanent style + temporary wet/new-cut look).
- Facial hair **grows over time** after a shave (stubble → beard).
- Voice: «одежда», «внешность», «побриться».
- See `docs/AVATAR_V0.1.md`.

## Smart Home (digital 2D copy)

- Per-room **lights** (on/off, brightness), **climate** (mode + target °C), **TV** and **music** power.
- State on `world.smartHome`, persisted with the apartment.
- Interactables: light switches, thermostat; TV / music player capabilities.
- Voice: «умный дом», «включи свет», «теплее», «телевизор», «музыка».
- See `docs/SMART_HOME_V0.1.md`.

## Voice commands

- **🎙** button or **V** key: speech commands (ru/en).
- Door, street, home, inventory, multiplayer, emotes, smart home, **avatar care**, help.
- Needs browser SpeechRecognition (Chrome/Edge; mic permission).

## Temporary keys

- Multiplayer → **Key** next to a player: grant 1h / 6h / 24h access.
- Guest can **visit with a key** even if the door is closed.
- Permissions: visit, media (cinema/TV/music), games.

## Visits, streets & cinema

- **Door open/closed**: room menu → allow or block visits.
- **Friends** (Multiplayer → Friend): street tier grows with contact count.
- On the **street**, open friend doors are visitable; closed doors are not.
- **Street Cinema** (3+ friends): pool symbolic credits; friends pay less to unlock a shared screening.
- **Barbershop** on the street for haircuts.

## Multiplayer & mobile

- **Multiplayer** button: room code, player list, room chat, emotes, invite link (`?room=`).
- Touch / narrow screens: virtual joystick + **E** interact; PWA manifest; safe-area insets.
- Requires `npm start` for WebSocket multiplayer.

## Furniture

- **E** in empty space → Inventory / furniture → place chair, plant, table, lamp near the avatar.
- Interact with placed furniture → pick up back to inventory.
- In an online room, placement is broadcast (`furniture.place` / `furniture.remove`); snapshot includes the room list.
- Local inventory still persists in localStorage.

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

Controls: WASD / drag / joystick · **E** interact · **V** voice · **Esc** close panel.

## Status

v0.11.0 — spatial loop + employment + realtime + mobile + furniture + accounts + visits/streets/cinema + keys + voice + smart home + **avatar (clothes, temps, shave, haircut)**.

Still boundaries: server auth, real film streaming, persistent keys across restarts, PIN, real IoT bridge, full canvas avatar sprites.

## Author

Югатн (Yugatn)
