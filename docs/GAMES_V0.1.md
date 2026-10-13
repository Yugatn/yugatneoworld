# Games & tournaments v0.1

Built-in logic / board games inside eWorld.

## Catalog

| id | Name | Players |
|----|------|---------|
| chess | Шахматы | 2 |
| checkers | Шашки | 2 |
| monopoly | Монополия | 2–6 |
| tictactoe | Крестики-нолики | 2 |
| reversi | Реверси | 2 |

Chess/checkers/monopoly use **symbolic** move notation (not full FIDE/engine). Tic-tac-toe has full rules + auto win/draw.

## Matches

`createMatch` → `joinMatch` → `playMove` → finish (win / draw / resign)

Rated games update a simple Elo-like rating (default 1000).

## Tournaments

Single-elimination bracket:

1. `createTournament`
2. `joinTournament` (power-of-2 size, byes supported)
3. `startTournament`
4. Match results advance bracket
5. `payoutTournamentPrize` → YC to winner

## World

- Object **Games table** in living room
- `WORLD_VERSION` **22** · `world.games`

## Voice

шахматы · шашки · монополия · турнир · игры
