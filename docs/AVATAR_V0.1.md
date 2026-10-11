# Avatar v0.1 — appearance, clothing, temporary effects, care

## Model

`world.avatarState` (pure domain in `src/domain/avatar.js`):

| Layer | Contents |
|-------|----------|
| **base** | body, skin, hairStyle, hairColor, facialHair |
| **worn** | top / bottom / shoes / accessory (item ids) |
| **wardrobe** | owned clothing ids |
| **temps** | temporary overlays with `expiresAt` |
| **lastShaveAt / lastHaircutAt** | growth / care clocks |

Legacy `world.avatar.appearance` is kept in sync via `toLegacyAppearance()` for older UI and multiplayer snapshots.

## Clothing

Catalog slots: top, bottom, shoes, accessory.
Styles: casual, formal, sport, neutral.

- **Equip** only if owned (`equip`).
- Formal outfit applies temporary `dressed_up`.
- Wardrobe object in bedroom: capability `avatar.clothes`.

## Temporary effects

| id | Meaning | Default TTL |
|----|---------|-------------|
| fresh_shave | After home shave | 6 h |
| new_haircut | After barber | 24 h |
| wet_hair | Right after cut | 30 m |
| dressed_up | Formal clothes | 8 h |
| tired | Optional fatigue | 2 h |

Purged automatically on read.

## Functional actions

### Shave at home

- Objects: **Mirror**, **Bathroom sink** (bedroom) — capability `avatar.shave`.
- `shaveAtHome(state)` → facial hair none, `lastShaveAt = now`, temp `fresh_shave`.
- Growth simulation: none → stubble (~18 h) → beard (~5 d) if not shaved again.

### Haircut in the city

- Place: **Barbershop** on the street (`avatar.haircut`).
- `haircutAtBarber(state, { style, color })` → permanent hair change + `new_haircut` + `wet_hair`.

### Change clothes

- Wardrobe / voice «одежда» → list owned items; equip by id.

## Voice (ru/en)

- wardrobe / одежда / шкаф
- appearance / внешность
- shave / побриться

## Not in v0.1

- Pixel art sprites per item (data is ready for a renderer)
- Paid haircuts / shops with currency sink
- Multiplayer broadcast of full avatarState (only legacy appearance today)
- Gendered catalogs or body morph targets
