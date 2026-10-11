# Smart Home v0.1 — digital 2D apartment copy

Optional control layer for the apartment: lights, climate, TV and music power.
This is a **digital twin** of the flat inside the spatial world — not a real IoT bridge in v0.1.

## Why it fits

- Same rooms as `apartment.js` (living room, kitchen, study, bedroom).
- Interacts with existing objects (TV, music player) via capabilities.
- Voice commands reuse the existing SpeechRecognition path.
- State lives on `world.smartHome` and is persisted with the world (version 5).

## Devices

| Kind | Scope | Controls |
|------|--------|----------|
| Light | Per room | on/off, brightness 0–100 |
| Climate | Apartment | mode: off / heat / cool / auto, target °C |
| TV | Media | on/off |
| Music | Media | on/off |

## Domain API (`src/domain/smart-home.js`)

- `createSmartHome(seed?)`
- `toggleLight` / `setLightOn` / `setBrightness` / `setAllLights`
- `roomLightFactor(state, roomId)` — 0.15–1.0 for canvas ambient tint
- `setClimateMode` / `setTargetTemp` / `adjustTemp`
- `toggleTv` / `toggleMusic`
- `summarize` / `listDevices` — UI panel helpers

## Voice (ru/en)

- Smart home panel · Lights on/off · Toggle light (current room)
- Warmer / Cooler · Toggle TV · Toggle music

See also `docs/VOICE_COMMANDS_V0.1.md`.

## World objects

Default world adds interactables:

- Light switch (per room) — `smarthome.lights`
- Thermostat (living room) — `smarthome.climate`
- TV / Music player gain `smarthome.tv` / `smarthome.music`

## Not in v0.1

- Real hardware / MQTT / Home Assistant bridge
- Per-device schedules or scenes
- Multiplayer sync of guest-controlled devices (host-only local for now)
- Energy metering

## Next steps

1. Wire panel + interact handlers in full `app-core` canvas body.
2. Apply `roomLightFactor` when drawing the room background.
3. Optional: `smartHome.sync` over WebSocket for co-present guests with media keys.
