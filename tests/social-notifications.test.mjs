import assert from "node:assert/strict";
import {
  createSocialState,
  sendFriendRequest,
  acceptFriendRequest,
  listFriends,
  areFriends,
  setPresence,
  listFriendsPresence,
  sendInvite,
  respondInvite,
  listInvites,
  summarizeSocial
} from "../src/domain/social.js";
import {
  createNotificationsState,
  listNotifications,
  markRead,
  markAllRead,
  unreadCount,
  summarizeNotifications
} from "../src/domain/notifications.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 23);
const world = createDefaultWorld();
assert.ok(world.social);
assert.ok(world.notifications);

const social = createSocialState();
const notif = createNotificationsState();

const req = sendFriendRequest(social, "alice", "bob", { notifyState: notif });
assert.equal(req.ok, true);
assert.equal(unreadCount(notif, "bob"), 1);

const acc = acceptFriendRequest(social, req.request.id, "bob", { notifyState: notif });
assert.equal(acc.ok, true);
assert.ok(areFriends(social, "alice", "bob"));
assert.ok(listFriends(social, "alice").includes("bob"));
assert.ok(unreadCount(notif, "alice") >= 1);

setPresence(social, "bob", { status: "online", roomId: "livingRoom", displayName: "Bob" });
const pres = listFriendsPresence(social, "alice");
assert.equal(pres[0].status, "online");

const inv = sendInvite(social, {
  fromId: "alice",
  toId: "bob",
  kind: "game",
  refId: "gm_demo",
  message: "Сыграем в шахматы?",
  notifyState: notif,
  friendsOnly: true
});
assert.equal(inv.ok, true);
assert.equal(listInvites(social, "bob").length, 1);

const resp = respondInvite(social, inv.invite.id, "bob", true, { notifyState: notif });
assert.equal(resp.ok, true);
assert.equal(resp.invite.status, "accepted");

const items = listNotifications(notif, "bob");
assert.ok(items.length >= 1);
markRead(notif, "bob", items[0].id);
markAllRead(notif, "alice");
assert.equal(unreadCount(notif, "alice"), 0);

assert.ok(summarizeSocial(social, "alice").includes("friends"));
assert.ok(summarizeNotifications(notif, "bob").includes("unread"));

assert.equal(matchVoiceCommand("друзья").id, "social.friends");
assert.equal(matchVoiceCommand("уведомления").id, "notify.list");
assert.equal(matchVoiceCommand("пригласить").id, "social.invite");

console.log("social-notifications tests OK");
