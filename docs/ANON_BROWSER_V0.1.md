# Anonymous browser v0.1

Private in-world browser at **computers** (laptop in living room / study).

## Gameplay

1. Avatar approaches a laptop (`distance ≤ 55`)
2. `openAtComputer` → anonymous session
3. `search` → results from curated **eWorld knowledge index**
4. `openPage` → tabs
5. `newCircuit` → wipe history + new circuit id
6. `closeBrowser` → full wipe

## Privacy design

- History is **session-only**
- Open sessions are **not** written to `localStorage` on save
- No linkage of query text to long-term profile
- Metaphor of Tor (circuit id), **not** a real Tor client or open-web proxy

## API

`src/domain/anon-browser.js`

- `findNearestComputer` · `openAtComputer` · `openBrowser`
- `search` · `openPage` · `newCircuit` · `clearHistory` · `closeBrowser`

## Voice

анонимный браузер · приватный поиск · новая цепочка · закрыть браузер

## World

`WORLD_VERSION` **21** · capabilities `browser.anonymous` on laptops
