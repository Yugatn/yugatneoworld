/**
 * Public activity feed / wall posts inside eWorld.
 */

import { sanitizeText } from "./security.js";

export const FEED_KINDS = Object.freeze([
  "status",
  "achievement",
  "game",
  "marketplace",
  "system"
]);

export const MAX_POSTS = 200;
export const MAX_BODY = 500;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createFeedState(seed = {}) {
  return {
    posts: Array.isArray(seed.posts) ? seed.posts.map((p) => ({ ...p, likes: [...(p.likes || [])] })) : []
  };
}

export function createPost(state, {
  userId,
  body = "",
  kind = "status",
  refType = null,
  refId = null
} = {}) {
  const text = sanitizeText(body, { maxLen: MAX_BODY }).trim();
  if (!text && kind === "status") return { ok: false, reason: "empty" };
  const k = FEED_KINDS.includes(kind) ? kind : "status";
  const post = {
    id: uid("post"),
    userId: String(userId || "local"),
    body: text,
    kind: k,
    refType: refType ? String(refType).slice(0, 32) : null,
    refId: refId ? String(refId).slice(0, 64) : null,
    likes: [],
    createdAt: Date.now()
  };
  state.posts.unshift(post);
  if (state.posts.length > MAX_POSTS) state.posts = state.posts.slice(0, MAX_POSTS);
  return { ok: true, post: { ...post, likes: [] } };
}

export function listFeed(state, { limit = 30, userId = null, kind = null } = {}) {
  let list = state.posts.slice();
  if (userId) list = list.filter((p) => p.userId === String(userId));
  if (kind) list = list.filter((p) => p.kind === kind);
  return list.slice(0, limit).map((p) => ({
    ...p,
    likes: [...p.likes],
    likeCount: p.likes.length
  }));
}

export function likePost(state, postId, userId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  const id = String(userId);
  if (post.likes.includes(id)) return { ok: false, reason: "already_liked" };
  post.likes.push(id);
  return { ok: true, likeCount: post.likes.length };
}

export function unlikePost(state, postId, userId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  const id = String(userId);
  const before = post.likes.length;
  post.likes = post.likes.filter((x) => x !== id);
  if (post.likes.length === before) return { ok: false, reason: "not_liked" };
  return { ok: true, likeCount: post.likes.length };
}

export function deletePost(state, postId, userId) {
  const idx = state.posts.findIndex((p) => p.id === postId);
  if (idx < 0) return { ok: false, reason: "not_found" };
  if (state.posts[idx].userId !== String(userId)) {
    return { ok: false, reason: "not_author" };
  }
  state.posts.splice(idx, 1);
  return { ok: true };
}

export function summarizeFeed(state) {
  return `${state.posts.length} posts`;
}
