# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## School · roles · access

- Roles: **student · parent · teacher · admin** with differentiated ACL (`src/domain/access-control.js`).
- Teacher: schedule edit / assign lessons & homework.
- **Admin**: full rights, moderate bulletin, grant/revoke permissions.
- Deep links: `?mode=school` · `?role=teacher` · `?role=admin`.

## Bulletin board · embeds

- **Доска объявлений** in living room + study; visibility public / students / teachers / staff / admin.
- Attach & display **YouTube**, **Google Docs / Sheets / Slides** (safe embed URLs).
- See `docs/ACCESS_EMBEDS_BULLETIN_V0.1.md`.

## Voice

- «я администратор» · «доска объявлений» · «прикрепить видео» · school/teacher modes.

## Other features

Home delivery, bathroom, recipes, avatar, smart home, keys, multiplayer — prior docs.

## Run

```bash
npm install && npm start
# http://localhost:8080
npm test
```

## Status

v0.17.0 — ACL, admin role, YouTube/Google embeds, bulletin board.

## Author

Югатн (Yugatn)
