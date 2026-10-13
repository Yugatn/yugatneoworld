/**
 * In-world notification inbox (not push OS notifications).
 */

import { sanitizeText } from "./security.js";

export const NOTIF_TYPES = Object.freeze([
  "friend_request",
  "friend_accepted",
  "invite",
  "invite_accepted",
  "game",
  "tournament",
  "marketplace",
  "payment",
  "school",
  "system",
  "generic"
]);

export const MAX_NOTIFS = 100;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createNotificationsState(seed = {}) {
  return {
    items: Array.isArray(seed.items) ? seed.items.map((n) => ({ ...n })) : []
  };
}

export function pushNotification(state, {
  userId,
  type = "generic",
  title = "",
  body = "",
  refType = null,
  refId = null
} = {}) {
  if (!state || !userId) return { ok: false, reason: "bad_args" };
  const t = NOTIF_TYPES.includes(type) ? type : "generic";
  const item = {
    id: uid("ntf"),
    userId: String(userId),
    type: t,
    title: sanitizeText(title, { maxLen: 80 }) || t,
    body: sanitizeText(body, { maxLen: 240 }),
    refType: refType ? String(refType).slice(0, 32) : null,
    refId: refId ? String(refId).slice(0, 64) : null,
    read: false,
    createdAt: Date.now()
  };
  state.items.push(item);
  // cap per user
  const forUser = state.items.filter((n) => n.userId === item.userId);
  if (forUser.length > MAX_NOTIFS) {
    const drop = forUser.length - MAX_NOTIFS;
    const ids = new Set(forUser.slice(0, drop).map((n) => n.id));
    state.items = state.items.filter((n) => !ids.has(n.id));
  }
  return { ok: true, notification: { ...item } };
}

export function listNotifications(state, userId, { unreadOnly = false, limit = 30 } = {}) {
  let list = state.items.filter((n) => n.userId === String(userId));
  if (unreadOnly) list = list.filter((n) => !n.read);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, limit).map((n) => ({ ...n }));
}

export function markRead(state, userId, notificationId) {
  const n = state.items.find(
    (x) => x.id === notificationId && x.userId === String(userId)
  );
  if (!n) return { ok: false, reason: "not_found" };
  n.read = true;
  return { ok: true, notification: { ...n } };
}

export function markAllRead(state, userId) {
  let n = 0;
  for (const item of state.items) {
    if (item.userId === String(userId) && !item.read) {
      item.read = true;
      n++;
    }
  }
  return { ok: true, marked: n };
}

export function unreadCount(state, userId) {
  return state.items.filter((n) => n.userId === String(userId) && !n.read).length;
}

export function summarizeNotifications(state, userId = "local") {
  return `${unreadCount(state, userId)} unread · ${state.items.filter((n) => n.userId === String(userId)).length} total`;
}
