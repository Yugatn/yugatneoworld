# Games and tournaments roadmap

## Current MVP

- **IMPLEMENTED:** `/games/` game plaza with accessible, responsive layout.
- **IMPLEMENTED:** local two-player tic-tac-toe with win/draw detection and reset.
- **IMPLEMENTED:** tournament creation UI for supported game IDs, format validation, local persistence, and removal.
- **IMPLEMENTED:** domain primitives for tournament validation, duplicate participant prevention, and single-elimination bracket skeletons.
- **NOT IMPLEMENTED:** shared server tournaments, matchmaking, authenticated player identities, online chess/checkers/Monopoly rules engines, authoritative scoring, anti-cheat, ratings, prizes, or moderation.

## Product architecture

Keep game rules separate from the transport and UI:

1. `src/domain/games/<game>`: pure deterministic rule engine, legal moves, terminal states, and serializable state.
2. `src/domain/game-tournaments.js`: tournament lifecycle, format rules, participant limits, bracket/round generation, standings, tie-break rules.
3. Server WebSocket/API layer: authenticated actor, server-side move validation, tournament membership/authorization, rate limits, event sequencing, idempotency, and authoritative results.
4. Browser UI: board rendering and input only; never trust client-supplied winner, score, or legal-move claims.
5. Persistence: versioned match events and snapshots, transactional tournament updates, recovery, and audit history.

## Delivery phases

### Phase 1 — playable local prototypes
- Complete tic-tac-toe tests, accessibility, restart, and error handling.
- Add deterministic rules engines for chess and checkers with fixtures and edge-case tests.
- Add Sudoku as a single-player logic mode.
- Keep each game's status explicit in the catalog; do not imply online support before it exists.

### Phase 2 — server-authoritative casual matches
- Define match create/join/leave lifecycle and spectator policy.
- Bind each seat to a verified server identity, not a display name or client-generated ID.
- Validate every move against the server's current game state.
- Add reconnect/resume, clocks where relevant, disconnect policy, rematch, and abuse limits.

### Phase 3 — tournaments
- Support single elimination and round robin with deterministic seeding and tie-breaks.
- Model states: draft, registration, check-in, in-progress, completed, cancelled.
- Prevent duplicate entries, late joins after lock, self-reported results, and concurrent bracket advancement.
- Publish standings and event history; include disputes and organizer permissions.

### Phase 4 — Monopoly and broader games
- Agree on a clear ruleset and licensing before implementing a Monopoly-like property-trading game; do not copy protected branding/artwork without permission.
- Add turn order, trade/auction rules, bankruptcy, deterministic dice events, and recovery tests.
- Add Four-in-a-row, Nim, Sudoku, and puzzle ladders as separate rule modules.

## Tournament invariants

- A player occupies at most one seat per tournament unless a format explicitly permits teams.
- A completed match has one server-validated outcome and cannot be overwritten by a later duplicate event.
- A bracket advances only after the match is complete under that game's rules.
- Every state transition is authorized, versioned, and idempotent.
- Client state is presentation data; the server owns authoritative state and standings.

## Evidence labels

- **IMPLEMENTED:** current browser-only MVP features listed above.
- **DERIVED:** server-authoritative moves and identity are prerequisites for fair online rankings.
- **NOT_TESTED:** load capacity, concurrent tournament updates, reconnect behavior, and anti-cheat.
- **RESIDUAL:** browser-local tournament records can be edited or lost and are not evidence of official results.
