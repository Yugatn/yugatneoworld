# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Accounts (local)

- **Account** button: create a named local identity, switch between saved accounts, or continue as Guest.
- Stable `subjectId` stored in the browser; no server password or OAuth in v0.1.
- Multiplayer display name follows the active session.

## Home delivery (whole network)

- Order **grocery, bathroom, household, cafe/restaurant** items with delivery into apartment **supplies**.
- Shops: Local Market, Bath & Body, Home Essentials, cafes/restaurants.
- Flow: draft → confirm → delivering → delivered (stock in pantry / bathroom cabinet).
- Entry points: kitchen phone/fridge, bathroom cabinet, laptop `shop.browse`.
- See `docs/COMMERCE_DELIVERY_V0.1.md`.

## Bathroom

- Full **bathroom** room: bath, shower, sink, cabinet, light.
- Order shampoo, soap, towels, toothpaste… with home delivery.
- Take a shower/bath (uses stock when available; temporary wet hair).

## Kitchen recipes

- **Recipe book** in the kitchen: everyday recipes (eggs, pasta, soup, chicken & rice…).
- See missing ingredients vs pantry; **order only what is missing** with one delivery draft.

## Avatar — appearance & care

- Clothing wardrobe, temporary effects, shave at home, haircut at city barbershop.
- See `docs/AVATAR_V0.1.md`.

## Smart Home (digital 2D copy)

- Lights per room (incl. bathroom), climate, TV, music.
- See `docs/SMART_HOME_V0.1.md`.

## Voice commands

- **🎙** / **V**: door, rooms, shop, recipes, shower/bath, smart home, avatar, help (ru/en).

## Temporary keys · Visits · Cinema · Multiplayer

- Keys, street visits, street cinema, friends, WebSocket rooms, mobile/PWA — as in prior versions.

## Furniture

- Place/pick furniture; sync in online rooms.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080`.

```bash
npm test
npm run check
```

Controls: WASD / drag / joystick · **E** interact · **V** voice · **Esc** close panel.

## Status

v0.12.0 — prior features + **bathroom** + **universal home delivery** + **kitchen recipes with ingredient orders**.

Still boundaries: real payments, courier NPC, full canvas UI body restore, server auth.

## Author

Югатн (Yugatn)
