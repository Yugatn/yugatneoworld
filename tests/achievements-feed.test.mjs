import assert from "node:assert/strict";
import {
  createAchievementsState,
  unlockAchievement,
  bumpProgress,
  recordGameEvent,
  listUserAchievements,
  listGameAchievements,
  totalPoints,
  summarizeAchievements,
  ACHIEVEMENT_DEFS
} from "../src/domain/achievements.js";
import {
  createFeedState,
  createPost,
  listFeed,
  likePost,
  deletePost,
  summarizeFeed
} from "../src/domain/feed.js";
import {
  createCurrencyState,
  ensureWallet,
  getBalance
} from "../src/domain/currency.js";
import { createNotificationsState, unreadCount } from "../src/domain/notifications.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 25);
const world = createDefaultWorld();
assert.ok(world.achievements);
assert.ok(world.feed);
assert.ok(ACHIEVEMENT_DEFS.length >= 20);
assert.ok(listGameAchievements().length >= 15);

const ach = createAchievementsState();
const notif = createNotificationsState();
const cur = createCurrencyState();
ensureWallet(cur, "alice", { initial: 0 });

const u = unlockAchievement(ach, "alice", "first_friend", {
  notifyState: notif,
  currencyState: cur,
  autoClaim: true
});
assert.equal(u.ok, true);
assert.ok(getBalance(cur, "alice") >= 5);
assert.ok(unreadCount(notif, "alice") >= 1);

// —— Game achievements ——
const chess = recordGameEvent(
  ach,
  "alice",
  { gameId: "chess", result: "win", rated: true },
  { notifyState: notif, currencyState: cur }
);
assert.ok(chess.unlocked.includes("first_match"));
assert.ok(chess.unlocked.includes("chess_win"));
assert.ok(chess.unlocked.includes("rated_win"));

recordGameEvent(ach, "alice", { gameId: "checkers", result: "win" }, { currencyState: cur });
assert.ok(
  listUserAchievements(ach, "alice").find((a) => a.id === "checkers_win").unlocked
);

recordGameEvent(ach, "alice", { gameId: "monopoly", result: "play" }, { currencyState: cur });
assert.ok(
  listUserAchievements(ach, "alice").find((a) => a.id === "monopoly_play").unlocked
);
recordGameEvent(ach, "alice", { gameId: "monopoly", result: "win" }, { currencyState: cur });
assert.ok(
  listUserAchievements(ach, "alice").find((a) => a.id === "monopoly_win").unlocked
);

recordGameEvent(ach, "alice", { gameId: "tictactoe", result: "win" }, { currencyState: cur });
recordGameEvent(ach, "alice", { gameId: "reversi", result: "win" }, { currencyState: cur });
assert.ok(
  listUserAchievements(ach, "alice").find((a) => a.id === "polyglot_gamer").unlocked,
  "all 5 games played"
);

recordGameEvent(ach, "alice", { tournamentJoin: true }, { currencyState: cur });
recordGameEvent(ach, "alice", { tournamentHost: true }, { currencyState: cur });
recordGameEvent(ach, "alice", { tournamentWin: true }, { currencyState: cur });
assert.ok(
  listUserAchievements(ach, "alice").find((a) => a.id === "tournament_champ").unlocked
);

// volume thresholds
for (let i = 0; i < 8; i++) {
  recordGameEvent(ach, "bob", { gameId: "chess", result: "win" }, {});
}
const bob = listUserAchievements(ach, "bob");
assert.ok(bob.find((a) => a.id === "wins_5").unlocked);
assert.ok(bob.find((a) => a.id === "chess_wins_5").unlocked);

assert.ok(totalPoints(ach, "alice") > 100);
assert.ok(summarizeAchievements(ach, "alice").includes("games"));

const feed = createFeedState();
const post = createPost(feed, {
  userId: "alice",
  body: "Выиграл партию в шахматы!",
  kind: "game"
});
assert.equal(post.ok, true);
likePost(feed, post.post.id, "bob");
assert.equal(listFeed(feed)[0].likeCount, 1);
deletePost(feed, post.post.id, "alice");
assert.equal(listFeed(feed).length, 0);
assert.ok(summarizeFeed(feed).includes("posts"));

bumpProgress(ach, "alice", "feed_posts", 1, { currencyState: cur });
assert.ok(listUserAchievements(ach, "alice").find((a) => a.id === "feed_poster").unlocked);

assert.equal(matchVoiceCommand("достижения").id, "achievements.list");
assert.equal(matchVoiceCommand("лента").id, "feed.list");
assert.equal(matchVoiceCommand("новый пост").id, "feed.post");

console.log("achievements-feed tests OK");
