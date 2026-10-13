/**
 * Direct messages between users (preferably friends).
 * Threads are 1:1; group chats can be added later.
 */

import { sanitizeText } from "./security.js";
import { areFriends } from "./social.js";
import { pushNotification } from "./notifications.js";

export const MAX_MESSAGE_LEN = 2000;
export const MAX_MESSAGES_PER_THREAD = 200;
export const MAX_THREADS_PER_USER = 50;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function pairKey(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

export function createMessengerState(seed = {}) {
  return {
    threads: Array.isArray(seed.threads)
      ? seed.threads.map((t) => ({
          ...t,
          participants: [...(t.participants || [])],
          messages: Array.isArray(t.messages) ? t.messages.map((m) => ({ ...m })) : []
        }))
      : []
  };
}

function findThread(state, userA, userB) {
  const key = pairKey(userA, userB);
  return state.threads.find((t) => t.key === key) || null;
}

function snapshotThread(t, forUserId = null) {
  const out = {
    id: t.id,
    key: t.key,
    participants: [...t.participants],
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
    messageCount: t.messages.length,
    lastMessage: t.messages.length
      ? { ...t.messages[t.messages.length - 1] }
      : null
  };
  if (forUserId) {
    out.unread = t.messages.filter(
      (m) => m.toId === String(forUserId) && !m.read
    ).length;
  }
  return out;
}

/**
 * Open or create a 1:1 thread.
 * friendsOnly default true when socialState provided.
 */
export function openThread(state, fromId, toId, {
  socialState = null,
  friendsOnly = true
} = {}) {
  const from = String(fromId);
  const to = String(toId);
  if (from === to) return { ok: false, reason: "self" };
  if (friendsOnly && socialState && !areFriends(socialState, from, to)) {
    return { ok: false, reason: "not_friends" };
  }

  let thread = findThread(state, from, to);
  if (!thread) {
    // soft limit threads involving from
    const mine = state.threads.filter((t) => t.participants.includes(from));
    if (mine.length >= MAX_THREADS_PER_USER) {
      return { ok: false, reason: "threads_full" };
    }
    thread = {
      id: uid("th"),
      key: pairKey(from, to),
      participants: [from, to].sort(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    state.threads.push(thread);
  }
  return { ok: true, thread: snapshotThread(thread, from) };
}

export function sendMessage(state, fromId, toId, text, {
  socialState = null,
  notifyState = null,
  friendsOnly = true
} = {}) {
  const body = sanitizeText(text, { maxLen: MAX_MESSAGE_LEN }).trim();
  if (!body) return { ok: false, reason: "empty" };

  const opened = openThread(state, fromId, toId, { socialState, friendsOnly });
  if (!opened.ok) return opened;

  const thread = findThread(state, fromId, toId);
  const msg = {
    id: uid("msg"),
    fromId: String(fromId),
    toId: String(toId),
    body,
    read: false,
    createdAt: Date.now()
  };
  thread.messages.push(msg);
  if (thread.messages.length > MAX_MESSAGES_PER_THREAD) {
    thread.messages = thread.messages.slice(-MAX_MESSAGES_PER_THREAD);
  }
  thread.updatedAt = Date.now();

  if (notifyState) {
    pushNotification(notifyState, {
      userId: toId,
      type: "generic",
      title: "Новое сообщение",
      body: body.slice(0, 80),
      refType: "thread",
      refId: thread.id
    });
  }

  return {
    ok: true,
    message: { ...msg },
    thread: snapshotThread(thread, fromId)
  };
}

export function listThreads(state, userId, { limit = 30 } = {}) {
  const id = String(userId);
  return state.threads
    .filter((t) => t.participants.includes(id))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map((t) => snapshotThread(t, id));
}

export function getThreadMessages(state, threadId, userId, {
  limit = 50,
  beforeId = null
} = {}) {
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) return { ok: false, reason: "not_found" };
  if (!thread.participants.includes(String(userId))) {
    return { ok: false, reason: "not_participant" };
  }
  let msgs = thread.messages.slice();
  if (beforeId) {
    const idx = msgs.findIndex((m) => m.id === beforeId);
    if (idx > 0) msgs = msgs.slice(0, idx);
  }
  msgs = msgs.slice(-limit);
  return {
    ok: true,
    threadId: thread.id,
    messages: msgs.map((m) => ({ ...m }))
  };
}

export function markThreadRead(state, threadId, userId) {
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) return { ok: false, reason: "not_found" };
  const id = String(userId);
  if (!thread.participants.includes(id)) return { ok: false, reason: "not_participant" };
  let n = 0;
  for (const m of thread.messages) {
    if (m.toId === id && !m.read) {
      m.read = true;
      n++;
    }
  }
  return { ok: true, marked: n };
}

export function unreadTotal(state, userId) {
  const id = String(userId);
  let n = 0;
  for (const t of state.threads) {
    if (!t.participants.includes(id)) continue;
    n += t.messages.filter((m) => m.toId === id && !m.read).length;
  }
  return n;
}

export function summarizeMessenger(state, userId = "local") {
  const threads = listThreads(state, userId).length;
  return `${threads} threads · ${unreadTotal(state, userId)} unread`;
}
