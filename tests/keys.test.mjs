import assert from "node:assert/strict";
import {
  createKeyState, grantKey, receiveKey, revokeKey, purgeExpired,
  hasValidKey, findKey, listActiveGranted, canUseMedia, canPlayGames,
  KEY_DURATIONS_MS, formatRemaining, isKeyValid
} from "../src/domain/keys.js";

const now = 1_700_000_000_000;
const state = createKeyState();

const key = grantKey(state, {
  hostId: "host1",
  guestId: "guest1",
  hostName: "Alice",
  guestName: "Bob",
  durationMs: KEY_DURATIONS_MS["1h"],
  permissions: ["visit", "media", "games"],
  now
});
assert.ok(key);
assert.equal(key.hostId, "host1");
assert.equal(key.guestId, "guest1");
assert.ok(key.permissions.includes("visit"));
assert.ok(key.permissions.includes("media"));
assert.equal(state.granted.length, 1);

assert.equal(hasValidKey(state, "guest1", "host1", null, now), true);
assert.equal(hasValidKey(state, "guest1", "host1", "media", now), true);
assert.equal(hasValidKey(state, "guest1", "host1", "games", now), true);
assert.equal(hasValidKey(state, "guest1", "host1", null, now + KEY_DURATIONS_MS["1h"] + 1), false);
assert.equal(canUseMedia(state, "guest1", "host1", now), true);
assert.equal(canPlayGames(state, "guest1", "host1", now), true);
assert.equal(canUseMedia(state, "other", "host1", now), false);

const guestState = createKeyState();
receiveKey(guestState, key);
assert.equal(hasValidKey(guestState, "guest1", "host1", "visit", now), true);
assert.equal(listActiveGranted(state, "host1", now).length, 1);

// Re-grant replaces previous
const key2 = grantKey(state, {
  hostId: "host1", guestId: "guest1", durationMs: KEY_DURATIONS_MS["6h"], now: now + 1000
});
assert.equal(state.granted.length, 1);
assert.equal(state.granted[0].id, key2.id);

assert.equal(revokeKey(state, key2.id), true);
assert.equal(hasValidKey(state, "guest1", "host1", null, now + 1000), false);

const short = grantKey(state, {
  hostId: "h", guestId: "g", durationMs: 60_000, now
});
assert.ok(formatRemaining(short, now).endsWith("m") || formatRemaining(short, now).includes("m"));
purgeExpired(state, now + 120_000);
assert.equal(state.granted.length, 0);

// Self-grant rejected
assert.equal(grantKey(state, { hostId: "x", guestId: "x", now }), null);

console.log("keys tests OK");
