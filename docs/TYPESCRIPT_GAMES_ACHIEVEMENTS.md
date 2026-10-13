# TypeScript: games + achievements

Source of truth:

- `src/domain-ts/achievements.ts`
- `src/domain-ts/games.ts`

Build:

```bash
npm run build:ts   # tsc → src/domain/*.js + *.d.ts
```

Runtime imports stay `./achievements.js` / `./games.js` (unchanged for the rest of the JS world).

`GameContext` wires achievements:

```ts
playMove(state, matchId, userId, move, {
  achievements,
  notifications,
  currency
});
```
