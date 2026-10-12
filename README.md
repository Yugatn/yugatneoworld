# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Accounts (local)

- **Account** button: create a named local identity, switch between saved accounts, or continue as Guest.
- Stable `subjectId` stored in the browser; no server password or OAuth in v0.1.
- Multiplayer display name follows the active session.

## School mode · Teacher role

- Focused layer for **students, teachers, parents** (not a separate app).
- **Teacher**: view + **edit** schedule, assign lessons and homework, manage classes.
- Student/parent: view schedule and homework only.
- Deep link: `?mode=school` · `?role=teacher` · voice: «я учитель» / «режим школы».
- See `docs/SCHOOL_MODE_V0.1.md` and `docs/LIFE_SIM_V0.1.md`.

## Home delivery (whole network)

- Order **grocery, bathroom, household, cafe/restaurant** items with delivery into apartment **supplies**.
- See `docs/COMMERCE_DELIVERY_V0.1.md`.

## Bathroom · Kitchen recipes · Avatar · Smart Home

- Bathroom, recipes, wardrobe/shave, digital smart home — as in prior docs.

## Voice commands

- **🎙** / **V**: door, rooms, shop, school/teacher mode, schedule, help (ru/en).

## Temporary keys · Visits · Cinema · Multiplayer · Furniture

- As in prior versions.

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

v0.16.0 — **teacher role** with schedule view/edit + assign lesson/homework; school mode v0.1.

Still boundaries: real payments, server teacher auth, grades LMS, full canvas UI restore.

## Author

Югатн (Yugatn)
