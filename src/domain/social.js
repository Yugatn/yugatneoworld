/**
 * Social graph: friends, presence, invites (games / cinema / generic).
 */

import { sanitizeText } from "./security.js";
import { pushNotification } from "./notifications.js";

export const REQUEST_STATUSES = Object.freeze(["pending", "accepted", "declined", "cancelled"]);
export const INVITE_KINDS = Object.freeze(["game", "tournament", "cinema", "podcast", "visit", "generic"]);
export const INVITE_STATUSES = Object.freeze(["pending", "accepted", "declined", "expired", "cancelled"]);
export const PRESENCE = Object.freeze(["online", "away", "busy", "offline"]);

export const MAX_FRIENDS = 200;
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createSocialState(seed = {}) {
  return {
    /** undirected edges stored once as sorted "a|b" */
    friendships: Array.isArray(seed.friendships) ? seed.friendships.map((f) => ({ ...f })) : [],
    requests: Array.isArray(seed.requests) ? seed.requests.map((r) => ({ ...r })) : [],
    invites: Array.isArray(seed.invites) ? seed.invites.map((i) => ({ ...i })) : [],
    /** userId → { status, roomId, lastSeenAt, displayName } */
    presence: seed.presence && typeof seed.presence === "object" ? { ...seed.presence } : {}
  };
}

function pairKey(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

export function areFriends(state, userA, userB) {
  const key = pairKey(userA, userB);
  return state.friendships.some((f) => f.key === key);
}

export function listFriends(state, userId) {
  const id = String(userId);
  return state.friendships
    .filter((f) => f.a === id || f.b === id)
    .map((f) => (f.a === id ? f.b : f.a));
}

export function sendFriendRequest(state, fromId, toId, { notifyState = null } = {}) {
  const from = String(fromId);
  const to = String(toId);
  if (from === to) return { ok: false, reason: "self" };
  if (areFriends(state, from, to)) return { ok: false, reason: "already_friends" };
  if (listFriends(state, from).length >= MAX_FRIENDS) return { ok: false, reason: "friends_full" };

  const existing = state.requests.find(
    (r) =>
      r.status === "pending" &&
      ((r.fromId === from && r.toId === to) || (r.fromId === to && r.toId === from))
  );
  if (existing) {
    if (existing.fromId === to && existing.toId === from) {
      // reciprocal → auto accept
      return acceptFriendRequest(state, existing.id, from, { notifyState });
    }
    return { ok: false, reason: "already_pending" };
  }

  const req = {
    id: uid("fr"),
    fromId: from,
    toId: to,
    status: "pending",
    createdAt: Date.now()
  };
  state.requests.push(req);
  if (notifyState) {
    pushNotification(notifyState, {
      userId: to,
      type: "friend_request",
      title: "Заявка в друзья",
      body: `От ${from}`,
      refType: "friend_request",
      refId: req.id
    });
  }
  return { ok: true, request: { ...req } };
}

export function acceptFriendRequest(state, requestId, actorId, { notifyState = null } = {}) {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, reason: "not_found" };
  if (req.status !== "pending") return { ok: false, reason: "not_pending" };
  if (req.toId !== String(actorId) && req.fromId !== String(actorId)) {
    // allow either side only if reciprocal path already checked
    if (req.toId !== String(actorId)) return { ok: false, reason: "not_recipient" };
  }
  if (req.toId !== String(actorId)) return { ok: false, reason: "not_recipient" };

  req.status = "accepted";
  const key = pairKey(req.fromId, req.toId);
  if (!state.friendships.some((f) => f.key === key)) {
    state.friendships.push({
      key,
      a: key.split("|")[0],
      b: key.split("|")[1],
      since: Date.now()
    });
  }
  if (notifyState) {
    pushNotification(notifyState, {
      userId: req.fromId,
      type: "friend_accepted",
      title: "Заявка принята",
      body: `${req.toId} добавил(а) вас в друзья`,
      refType: "friend",
      refId: key
    });
  }
  return { ok: true, request: { ...req }, friends: listFriends(state, actorId) };
}

export function declineFriendRequest(state, requestId, actorId) {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, reason: "not_found" };
  if (req.toId !== String(actorId)) return { ok: false, reason: "not_recipient" };
  if (req.status !== "pending") return { ok: false, reason: "not_pending" };
  req.status = "declined";
  return { ok: true, request: { ...req } };
}

export function removeFriend(state, userId, otherId) {
  const key = pairKey(userId, otherId);
  const before = state.friendships.length;
  state.friendships = state.friendships.filter((f) => f.key !== key);
  if (state.friendships.length === before) return { ok: false, reason: "not_friends" };
  return { ok: true, friends: listFriends(state, userId) };
}

export function setPresence(state, userId, {
  status = "online",
  roomId = null,
  displayName = null
} = {}) {
  const id = String(userId);
  const st = PRESENCE.includes(status) ? status : "online";
  state.presence[id] = {
    status: st,
    roomId: roomId ? String(roomId) : null,
    displayName: displayName
      ? sanitizeText(displayName, { maxLen: 40 })
      : state.presence[id]?.displayName || id,
    lastSeenAt: Date.now()
  };
  return { ok: true, presence: { ...state.presence[id] } };
}

export function getPresence(state, userId) {
  return state.presence[String(userId)]
    ? { ...state.presence[String(userId)] }
    : { status: "offline", roomId: null, displayName: String(userId), lastSeenAt: null };
}

export function listFriendsPresence(state, userId) {
  return listFriends(state, userId).map((fid) => ({
    userId: fid,
    ...getPresence(state, fid)
  }));
}

/**
 * Invite a user (preferably a friend) to a game / cinema / etc.
 */
export function sendInvite(state, {
  fromId,
  toId,
  kind = "generic",
  refId = null,
  message = "",
  notifyState = null,
  friendsOnly = false
} = {}) {
  const from = String(fromId);
  const to = String(toId);
  if (from === to) return { ok: false, reason: "self" };
  if (!INVITE_KINDS.includes(kind)) return { ok: false, reason: "bad_kind" };
  if (friendsOnly && !areFriends(state, from, to)) {
    return { ok: false, reason: "not_friends" };
  }

  const invite = {
    id: uid("inv"),
    fromId: from,
    toId: to,
    kind,
    refId: refId ? String(refId).slice(0, 64) : null,
    message: sanitizeText(message, { maxLen: 160 }),
    status: "pending",
    createdAt: Date.now(),
    expiresAt: Date.now() + INVITE_TTL_MS
  };
  state.invites.push(invite);
  if (notifyState) {
    pushNotification(notifyState, {
      userId: to,
      type: "invite",
      title: kindTitle(kind),
      body: invite.message || `Приглашение от ${from}`,
      refType: "invite",
      refId: invite.id
    });
  }
  return { ok: true, invite: { ...invite } };
}

function kindTitle(kind) {
  const map = {
    game: "Приглашение в игру",
    tournament: "Приглашение на турнир",
    cinema: "Приглашение в кино",
    podcast: "Приглашение на подкаст",
    visit: "Приглашение в гости",
    generic: "Приглашение"
  };
  return map[kind] || "Приглашение";
}

export function respondInvite(state, inviteId, actorId, accept, { notifyState = null } = {}) {
  const inv = state.invites.find((i) => i.id === inviteId);
  if (!inv) return { ok: false, reason: "not_found" };
  if (inv.toId !== String(actorId)) return { ok: false, reason: "not_recipient" };
  if (inv.status !== "pending") return { ok: false, reason: "not_pending" };
  if (Date.now() > inv.expiresAt) {
    inv.status = "expired";
    return { ok: false, reason: "expired" };
  }
  inv.status = accept ? "accepted" : "declined";
  if (notifyState && accept) {
    pushNotification(notifyState, {
      userId: inv.fromId,
      type: "invite_accepted",
      title: "Приглашение принято",
      body: `${actorId} принял(а) приглашение`,
      refType: "invite",
      refId: inv.id
    });
  }
  return { ok: true, invite: { ...inv } };
}

export function listInvites(state, userId, { direction = "inbox", status = "pending" } = {}) {
  const id = String(userId);
  let list = state.invites.filter((i) =>
    direction === "sent" ? i.fromId === id : i.toId === id
  );
  if (status) list = list.filter((i) => i.status === status);
  // expire lazily
  const now = Date.now();
  for (const i of list) {
    if (i.status === "pending" && now > i.expiresAt) i.status = "expired";
  }
  if (status) list = list.filter((i) => i.status === status);
  return list.map((i) => ({ ...i }));
}

export function listPendingFriendRequests(state, userId) {
  const id = String(userId);
  return state.requests
    .filter((r) => r.toId === id && r.status === "pending")
    .map((r) => ({ ...r }));
}

export function summarizeSocial(state, userId = "local") {
  const friends = listFriends(state, userId).length;
  const req = listPendingFriendRequests(state, userId).length;
  const inv = listInvites(state, userId).length;
  return `${friends} friends · ${req} requests · ${inv} invites`;
}
