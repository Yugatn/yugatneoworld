import assert from "node:assert/strict";
import {
  createGamesState,
  listGames,
  createMatch,
  joinMatch,
  playMove,
  createTournament,
  joinTournament,
  startTournament,
  listTournaments,
  leaderboard,
  payoutTournamentPrize,
  getRating,
  summarizeGames
} from "../src/domain/games.js";
import {
  createCurrencyState,
  ensureWallet,
  getBalance
} from "../src/domain/currency.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 22);
const world = createDefaultWorld();
assert.ok(world.games);
assert.ok(listGames().length >= 5);
assert.ok(world.objects.some((o) => (o.capabilities || []).includes("games.play")));

const st = createGamesState();

// Tic-tac-toe full game
const m = createMatch(st, { gameId: "tictactoe", hostId: "p1" });
assert.equal(m.ok, true);
joinMatch(st, m.match.id, "p2");
playMove(st, m.match.id, "p1", { cell: 0 });
playMove(st, m.match.id, "p2", { cell: 3 });
playMove(st, m.match.id, "p1", { cell: 1 });
playMove(st, m.match.id, "p2", { cell: 4 });
const fin = playMove(st, m.match.id, "p1", { cell: 2 });
assert.equal(fin.match.status, "finished");
assert.equal(fin.match.winnerId, "p1");
assert.ok(getRating(st, "p1", "tictactoe") > 1000);

// Chess match + resign
const ch = createMatch(st, { gameId: "chess", hostId: "a" });
joinMatch(st, ch.match.id, "b");
playMove(st, ch.match.id, "a", "e2e4");
const res = playMove(st, ch.match.id, "b", "resign");
assert.equal(res.match.status, "finished");
assert.equal(res.match.winnerId, "a");

// Checkers + monopoly stubs
assert.equal(createMatch(st, { gameId: "checkers", hostId: "c" }).ok, true);
const mono = createMatch(st, { gameId: "monopoly", hostId: "m1" });
joinMatch(st, mono.match.id, "m2");
const roll = playMove(st, mono.match.id, "m1", { dice: 7, notation: "roll7" });
assert.equal(roll.ok, true);

// Tournament
const tn = createTournament(st, {
  gameId: "tictactoe",
  hostId: "host",
  name: "Cup",
  maxEntrants: 4,
  prizeYc: 20
});
assert.equal(tn.ok, true);
joinTournament(st, tn.tournament.id, "host");
joinTournament(st, tn.tournament.id, "u2");
joinTournament(st, tn.tournament.id, "u3");
joinTournament(st, tn.tournament.id, "u4");
const started = startTournament(st, tn.tournament.id, "host");
assert.equal(started.ok, true);
assert.equal(started.tournament.status, "running");
assert.ok(started.tournament.bracket.length >= 2);
assert.ok(listTournaments(st, { status: "running" }).length >= 1);

const cur = createCurrencyState();
ensureWallet(cur, "champ", { initial: 0 });
// force finish for prize test
const t2 = createTournament(st, { gameId: "chess", hostId: "h", maxEntrants: 2, prizeYc: 10 });
joinTournament(st, t2.tournament.id, "h");
joinTournament(st, t2.tournament.id, "champ");
startTournament(st, t2.tournament.id, "h");
const tLive = st.tournaments.find((x) => x.id === t2.tournament.id);
// complete first match via resign
const br = tLive.bracket.find((b) => b.matchId);
if (br) {
  const match = st.matches.find((m) => m.id === br.matchId);
  playMove(st, match.id, match.players[1], "resign");
}
assert.equal(tLive.status, "finished");
const pay = payoutTournamentPrize(st, cur, tLive.id);
assert.equal(pay.ok, true);
assert.ok(getBalance(cur, pay.winnerId) >= 10);

assert.ok(leaderboard(st, "tictactoe").length >= 1);
assert.ok(summarizeGames(st).includes("games"));

assert.equal(matchVoiceCommand("шахматы").id, "games.chess");
assert.equal(matchVoiceCommand("турнир").id, "games.tournament");
assert.equal(matchVoiceCommand("шашки").id, "games.checkers");
assert.equal(matchVoiceCommand("монополия").id, "games.monopoly");

console.log("games tests OK");
