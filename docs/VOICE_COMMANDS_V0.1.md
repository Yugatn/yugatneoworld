# Voice commands v0.1

## Control

- Toolbar button **🎙** — start / stop listening
- Keyboard **V** (when not typing in an input)

Uses the browser **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`).
Best support: Chromium-based browsers over HTTPS or `localhost`.

## Languages

Recognition language follows `navigator.language` (`ru-RU` if Russian, otherwise `en-US`).
Command matching accepts both Russian and English phrases.

## Commands

| Action | Examples |
|--------|----------|
| Open door | open door, открой дверь |
| Close door | close door, закрой дверь |
| Interact | interact, действие |
| Street | street, city, на улицу, город |
| Home | home, apartment, домой |
| Inventory | inventory, инвентарь, мебель |
| Multiplayer | multiplayer, мультиплеер |
| Account | account, аккаунт |
| Save | save, сохранить |
| Emotes | wave / heart / clap / think / hello |
| Smart home panel | smart home, умный дом |
| Lights on / off | lights on, включи свет / lights off, выключи свет |
| Toggle light | toggle light, свет |
| Warmer / Cooler | warmer, теплее / cooler, холоднее |
| Toggle TV | tv, телевизор |
| Toggle music | music, музыка |
| Help | help, помощь, команды |

## Architecture

- `src/domain/voice-commands.js` — pure transcript → action id matching (tested in Node)
- `src/integration/voice-ui.js` — SpeechRecognition wiring and `runVoiceCommand`
- Smart-home actions call into `world.smartHome` via the voice API (`docs/SMART_HOME_V0.1.md`)

## Not in v0.1

- Continuous always-on listening
- Server-side speech processing
- Custom wake word
- Offline STT models
