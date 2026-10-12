/**
 * Bulletin board (доска объявлений) — school / home announcements with optional embeds.
 */

import { parseEmbedUrl } from "./embeds.js";
import { can } from "./access-control.js";

export const POST_VISIBILITY = Object.freeze([
  "public",    // everyone in school mode
  "students",
  "teachers",
  "staff",     // teacher + admin
  "admin"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createBulletinState(seed = {}) {
  return {
    posts: Array.isArray(seed.posts)
      ? seed.posts.map((p) => ({
          ...p,
          embeds: p.embeds ? p.embeds.map((e) => ({ ...e })) : []
        }))
      : []
  };
}

function visibilityAllows(visibility, role) {
  const v = POST_VISIBILITY.includes(visibility) ? visibility : "public";
  if (v === "public") return true;
  if (role === "admin") return true;
  if (v === "admin") return role === "admin";
  if (v === "staff") return role === "teacher" || role === "admin";
  if (v === "teachers") return role === "teacher" || role === "admin";
  if (v === "students") return role === "student" || role === "parent" || role === "teacher" || role === "admin";
  return false;
}

/**
 * Create a bulletin post. Requires bulletin create permission for role.
 */
export function createPost(
  state,
  accessRole,
  accessState,
  {
    title,
    body = "",
    authorName = "Anonymous",
    authorId = null,
    visibility = "public",
    pin = false,
    embedUrls = []
  } = {}
) {
  if (!can(accessRole, "bulletin", "create", accessState)) {
    return { ok: false, reason: "forbidden" };
  }
  const t = String(title || "").trim().slice(0, 120);
  if (!t) return { ok: false, reason: "empty_title" };
  const embeds = [];
  for (const u of (embedUrls || []).slice(0, 5)) {
    const parsed = parseEmbedUrl(u);
    if (parsed) embeds.push({ id: uid("emb"), ...parsed });
  }
  const post = {
    id: uid("post"),
    title: t,
    body: String(body || "").slice(0, 2000),
    authorName: String(authorName).slice(0, 40),
    authorId: authorId ? String(authorId).slice(0, 64) : null,
    visibility: POST_VISIBILITY.includes(visibility) ? visibility : "public",
    pin: Boolean(pin) && (accessRole === "admin" || accessRole === "teacher"),
    embeds,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.posts.unshift(post);
  return { ok: true, post };
}

export function listPosts(state, accessRole, accessState = null) {
  if (!can(accessRole, "bulletin", "view", accessState)) return [];
  return state.posts
    .filter((p) => visibilityAllows(p.visibility, accessRole))
    .map((p) => ({
      ...p,
      embeds: (p.embeds || []).map((e) => ({ ...e }))
    }))
    .sort((a, b) => {
      if (a.pin !== b.pin) return a.pin ? -1 : 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
}

export function getPost(state, postId) {
  return state.posts.find((p) => p.id === postId) || null;
}

export function updatePost(state, accessRole, accessState, postId, patch = {}) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  const isAuthor = post.authorId && patch.actorId && post.authorId === patch.actorId;
  if (!can(accessRole, "bulletin", "edit", accessState) && !isAuthor) {
    return { ok: false, reason: "forbidden" };
  }
  if (patch.title != null) post.title = String(patch.title).trim().slice(0, 120) || post.title;
  if (patch.body != null) post.body = String(patch.body).slice(0, 2000);
  if (patch.visibility != null && POST_VISIBILITY.includes(patch.visibility)) {
    post.visibility = patch.visibility;
  }
  if (patch.pin != null && (accessRole === "admin" || accessRole === "teacher")) {
    post.pin = Boolean(patch.pin);
  }
  post.updatedAt = Date.now();
  return { ok: true, post };
}

export function deletePost(state, accessRole, accessState, postId, actorId = null) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  const isAuthor = post.authorId && actorId && post.authorId === actorId;
  const canDelete =
    can(accessRole, "bulletin", "delete", accessState) ||
    can(accessRole, "bulletin", "moderate", accessState) ||
    isAuthor;
  if (!canDelete) return { ok: false, reason: "forbidden" };
  state.posts = state.posts.filter((p) => p.id !== postId);
  return { ok: true };
}

/** Attach embed URL to existing post. */
export function attachEmbedToPost(state, accessRole, accessState, postId, url, title = "") {
  if (!can(accessRole, "embed", "create", accessState) && !can(accessRole, "bulletin", "edit", accessState)) {
    return { ok: false, reason: "forbidden" };
  }
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  if (!post.embeds) post.embeds = [];
  if (post.embeds.length >= 5) return { ok: false, reason: "limit" };
  const parsed = parseEmbedUrl(url, title);
  if (!parsed) return { ok: false, reason: "unsupported_url" };
  const emb = { id: uid("emb"), ...parsed };
  post.embeds.push(emb);
  post.updatedAt = Date.now();
  return { ok: true, embed: emb, post };
}

export function summarizeBulletin(state) {
  const n = state.posts.length;
  const pinned = state.posts.filter((p) => p.pin).length;
  if (!n) return "Bulletin empty";
  return `${n} post(s)${pinned ? `, ${pinned} pinned` : ""}`;
}
