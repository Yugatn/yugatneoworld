import assert from "node:assert/strict";
import {
  createAchievementsState,
  unlockAchievement,
  bumpProgress,
  listUserAchievements,
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
assert.ok(ACHIEVEMENT_DEFS.length >= 10);

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

const bump = bumpProgress(ach, "alice", "matches", 1, {
  notifyState: notif,
  currencyState: cur
});
assert.ok(bump.unlocked.includes("first_match"));

assert.ok(totalPoints(ach, "alice") >= 25);
assert.ok(listUserAchievements(ach, "alice").some((a) => a.unlocked));
assert.ok(summarizeAchievements(ach, "alice").includes("badges"));

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
