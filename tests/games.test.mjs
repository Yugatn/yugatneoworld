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
import {
  createAchievementsState,
  listUserAchievements
} from "../src/domain/achievements.js";
import { createNotificationsState } from "../src/domain/notifications.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 22);
const world = createDefaultWorld();
assert.ok(world.games);
assert.ok(listGames().length >= 5);
assert.ok(world.objects.some((o) => (o.capabilities || []).includes("games.play")));

const st = createGamesState();
const ach = createAchievementsState();
const notif = createNotificationsState();
const cur = createCurrencyState();
ensureWallet(cur, "p1", { initial: 0 });
ensureWallet(cur, "a", { initial: 0 });
const ctx = { achievements: ach, notifications: notif, currency: cur };

// Tic-tac-toe full game → achievements
const m = createMatch(st, { gameId: "tictactoe", hostId: "p1" });
assert.equal(m.ok, true);
joinMatch(st, m.match.id, "p2");
playMove(st, m.match.id, "p1", { cell: 0 }, ctx);
playMove(st, m.match.id, "p2", { cell: 3 }, ctx);
playMove(st, m.match.id, "p1", { cell: 1 }, ctx);
playMove(st, m.match.id, "p2", { cell: 4 }, ctx);
const fin = playMove(st, m.match.id, "p1", { cell: 2 }, ctx);
assert.equal(fin.match.status, "finished");
assert.equal(fin.match.winnerId, "p1");
assert.ok(getRating(st, "p1", "tictactoe") > 1000);
assert.ok(
  listUserAchievements(ach, "p1").find((a) => a.id === "tictactoe_win")?.unlocked,
  "tictactoe_win from playMove"
);
assert.ok(
  listUserAchievements(ach, "p1").find((a) => a.id === "first_match")?.unlocked
);
assert.ok(
  listUserAchievements(ach, "p1").find((a) => a.id === "rated_win")?.unlocked
);

// Chess match + resign → chess_win for winner
const ch = createMatch(st, { gameId: "chess", hostId: "a" });
joinMatch(st, ch.match.id, "b");
playMove(st, ch.match.id, "a", "e2e4", ctx);
const res = playMove(st, ch.match.id, "b", "resign", ctx);
assert.equal(res.match.status, "finished");
assert.equal(res.match.winnerId, "a");
assert.ok(
  listUserAchievements(ach, "a").find((x) => x.id === "chess_win")?.unlocked
);

// Checkers + monopoly stubs
assert.equal(createMatch(st, { gameId: "checkers", hostId: "c" }).ok, true);
const mono = createMatch(st, { gameId: "monopoly", hostId: "m1" });
joinMatch(st, mono.match.id, "m2");
const roll = playMove(st, mono.match.id, "m1", { dice: 7, notation: "roll7" }, ctx);
assert.equal(roll.ok, true);

// Tournament with achievement hooks
const tn = createTournament(st, {
  gameId: "tictactoe",
  hostId: "host",
  name: "Cup",
  maxEntrants: 4,
  prizeYc: 20
});
assert.equal(tn.ok, true);
joinTournament(st, tn.tournament.id, "host", ctx);
joinTournament(st, tn.tournament.id, "u2", ctx);
joinTournament(st, tn.tournament.id, "u3", ctx);
joinTournament(st, tn.tournament.id, "u4", ctx);
assert.ok(
  listUserAchievements(ach, "host").find((a) => a.id === "tournament_join")?.unlocked
);
const started = startTournament(st, tn.tournament.id, "host", ctx);
assert.equal(started.ok, true);
assert.equal(started.tournament.status, "running");
assert.ok(
  listUserAchievements(ach, "host").find((a) => a.id === "tournament_host")?.unlocked
);
assert.ok(started.tournament.bracket.length >= 2);
assert.ok(listTournaments(st, { status: "running" }).length >= 1);

ensureWallet(cur, "champ", { initial: 0 });
const t2 = createTournament(st, {
  gameId: "chess",
  hostId: "h",
  maxEntrants: 2,
  prizeYc: 10
});
joinTournament(st, t2.tournament.id, "h", ctx);
joinTournament(st, t2.tournament.id, "champ", ctx);
startTournament(st, t2.tournament.id, "h", ctx);
const tLive = st.tournaments.find((x) => x.id === t2.tournament.id);
const br = tLive.bracket.find((b) => b.matchId);
if (br) {
  const match = st.matches.find((mm) => mm.id === br.matchId);
  playMove(st, match.id, match.players[1], "resign", ctx);
}
assert.equal(tLive.status, "finished");
assert.ok(
  listUserAchievements(ach, tLive.winnerId).find((a) => a.id === "tournament_champ")
    ?.unlocked,
  "tournament champ from finish"
);
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
