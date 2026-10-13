import assert from "node:assert/strict";
import {
  createMessengerState,
  sendMessage,
  listThreads,
  getThreadMessages,
  markThreadRead,
  unreadTotal,
  summarizeMessenger
} from "../src/domain/messenger.js";
import {
  createSocialState,
  sendFriendRequest,
  acceptFriendRequest
} from "../src/domain/social.js";
import { createNotificationsState, unreadCount } from "../src/domain/notifications.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 24);
const world = createDefaultWorld();
assert.ok(world.messenger);
assert.ok(
  world.objects.some((o) => (o.capabilities || []).includes("messenger.dm"))
);

const social = createSocialState();
const notif = createNotificationsState();
const msg = createMessengerState();

const fr = sendFriendRequest(social, "alice", "bob");
acceptFriendRequest(social, fr.request.id, "bob");

// non-friends blocked
const blocked = sendMessage(msg, "alice", "stranger", "hi", {
  socialState: social,
  friendsOnly: true
});
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, "not_friends");

const sent = sendMessage(msg, "alice", "bob", "Привет, сыграем в шахматы?", {
  socialState: social,
  notifyState: notif,
  friendsOnly: true
});
assert.equal(sent.ok, true);
assert.ok(sent.message.body.includes("шахматы"));
assert.ok(unreadCount(notif, "bob") >= 1);
assert.equal(unreadTotal(msg, "bob"), 1);

sendMessage(msg, "bob", "alice", "Давай!", { socialState: social });

const threads = listThreads(msg, "alice");
assert.equal(threads.length, 1);
assert.ok(threads[0].lastMessage);

const hist = getThreadMessages(msg, threads[0].id, "alice");
assert.equal(hist.ok, true);
assert.equal(hist.messages.length, 2);

const read = markThreadRead(msg, threads[0].id, "bob");
assert.equal(read.ok, true);
assert.equal(unreadTotal(msg, "bob"), 0);

assert.ok(summarizeMessenger(msg, "alice").includes("threads"));
assert.equal(matchVoiceCommand("сообщения").id, "messenger.list");
assert.equal(matchVoiceCommand("написать сообщение").id, "messenger.send");

console.log("messenger tests OK");
