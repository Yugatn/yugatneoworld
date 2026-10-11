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
| Help | help, помощь, команды |

## Architecture

- `src/domain/voice-commands.js` — pure transcript → action id matching (tested in Node)
- `src/app.js` — SpeechRecognition wiring and `runVoiceCommand`

## Not in v0.1

- Continuous always-on listening
- Server-side speech processing
- Custom wake word
- Offline STT models
