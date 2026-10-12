/**
 * Bulletin board (доска объявлений) — announcements with attachments
 * (YouTube, Google Docs / Sheets / Slides, generic links).
 */

import { parseEmbedUrl, embedDisplay } from "./embeds.js";
import { can } from "./access-control.js";

export const POST_VISIBILITY = Object.freeze([
  "public",
  "students",
  "teachers",
  "staff",
  "admin"
]);

/** Max attachments per announcement. */
export const MAX_ATTACHMENTS = 5;

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
  if (v === "students") {
    return role === "student" || role === "parent" || role === "teacher" || role === "admin";
  }
  return false;
}

/**
 * Normalize attachment inputs into embed objects.
 * Accepts: string URL | { url, title? } | already-parsed embed-like objects.
 * @returns {{ embeds: object[], skipped: string[] }}
 */
export function normalizeAttachments(inputs = []) {
  const embeds = [];
  const skipped = [];
  const list = Array.isArray(inputs) ? inputs : [inputs];
  for (const raw of list.slice(0, MAX_ATTACHMENTS)) {
    if (!raw) continue;
    if (typeof raw === "string") {
      const parsed = parseEmbedUrl(raw);
      if (parsed) embeds.push({ id: uid("emb"), ...parsed });
      else skipped.push(raw);
      continue;
    }
    if (typeof raw === "object") {
      if (raw.embedUrl || raw.sourceUrl || raw.type) {
        // already structured
        const parsed = raw.sourceUrl ? parseEmbedUrl(raw.sourceUrl, raw.title || "") : null;
        if (parsed) {
          embeds.push({ id: raw.id || uid("emb"), ...parsed, title: String(raw.title || parsed.title).slice(0, 120) });
        } else if (raw.type && raw.sourceUrl) {
          embeds.push({
            id: raw.id || uid("emb"),
            type: raw.type,
            title: String(raw.title || "Attachment").slice(0, 120),
            sourceUrl: String(raw.sourceUrl).slice(0, 500),
            embedUrl: raw.embedUrl || null,
            videoId: raw.videoId || null,
            fileId: raw.fileId || null
          });
        } else skipped.push(String(raw.url || raw.sourceUrl || "?"));
        continue;
      }
      if (raw.url) {
        const parsed = parseEmbedUrl(raw.url, raw.title || "");
        if (parsed) embeds.push({ id: uid("emb"), ...parsed });
        else skipped.push(String(raw.url));
        continue;
      }
    }
    skipped.push(String(raw));
  }
  return { embeds, skipped };
}

/**
 * Create a bulletin post with optional attachments.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.body]
 * @param {string[]} [opts.embedUrls] — plain URL list
 * @param {Array<string|{url,title}|object>} [opts.attachments] — preferred multi-attach input
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
    embedUrls = [],
    attachments = null
  } = {}
) {
  if (!can(accessRole, "bulletin", "create", accessState)) {
    return { ok: false, reason: "forbidden" };
  }
  const t = String(title || "").trim().slice(0, 120);
  if (!t) return { ok: false, reason: "empty_title" };

  const inputs =
    attachments != null
      ? attachments
      : Array.isArray(embedUrls)
        ? embedUrls
        : [];
  const { embeds, skipped } = normalizeAttachments(inputs);

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
  return {
    ok: true,
    post,
    attachmentCount: embeds.length,
    skippedAttachments: skipped
  };
}

/**
 * High-level: create announcement with attachments in one call.
 * Same permissions as createPost.
 */
export function createAnnouncement(state, accessRole, accessState, opts = {}) {
  return createPost(state, accessRole, accessState, {
    title: opts.title,
    body: opts.body,
    authorName: opts.authorName,
    authorId: opts.authorId,
    visibility: opts.visibility,
    pin: opts.pin,
    attachments: opts.attachments ?? opts.embedUrls ?? []
  });
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

/** UI-ready post: embeds as embedDisplay list. */
export function postDisplay(post) {
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    authorName: post.authorName,
    visibility: post.visibility,
    pin: post.pin,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    attachments: (post.embeds || []).map((e) => embedDisplay(e)).filter(Boolean),
    attachmentCount: (post.embeds || []).length
  };
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
  if (patch.attachments != null || patch.embedUrls != null) {
    const { embeds } = normalizeAttachments(patch.attachments ?? patch.embedUrls);
    post.embeds = embeds;
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

/** Attach one more URL to existing post (max MAX_ATTACHMENTS). */
export function attachEmbedToPost(state, accessRole, accessState, postId, url, title = "") {
  if (!can(accessRole, "embed", "create", accessState) && !can(accessRole, "bulletin", "edit", accessState)) {
    return { ok: false, reason: "forbidden" };
  }
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  if (!post.embeds) post.embeds = [];
  if (post.embeds.length >= MAX_ATTACHMENTS) return { ok: false, reason: "limit" };
  const parsed = parseEmbedUrl(url, title);
  if (!parsed) return { ok: false, reason: "unsupported_url" };
  const emb = { id: uid("emb"), ...parsed };
  post.embeds.push(emb);
  post.updatedAt = Date.now();
  return { ok: true, embed: emb, post };
}

/** Attach several URLs at once. */
export function attachManyToPost(state, accessRole, accessState, postId, urls = []) {
  const results = [];
  for (const u of (urls || []).slice(0, MAX_ATTACHMENTS)) {
    const url = typeof u === "string" ? u : u?.url;
    const title = typeof u === "object" ? u.title || "" : "";
    if (!url) continue;
    const r = attachEmbedToPost(state, accessRole, accessState, postId, url, title);
    results.push(r);
    if (!r.ok && r.reason === "limit") break;
  }
  const post = getPost(state, postId);
  return {
    ok: results.some((r) => r.ok),
    results,
    attachmentCount: post?.embeds?.length || 0,
    post
  };
}

export function removeEmbedFromPost(state, accessRole, accessState, postId, embedId, actorId = null) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return { ok: false, reason: "not_found" };
  const isAuthor = post.authorId && actorId && post.authorId === actorId;
  if (!can(accessRole, "bulletin", "edit", accessState) && !isAuthor) {
    return { ok: false, reason: "forbidden" };
  }
  const before = (post.embeds || []).length;
  post.embeds = (post.embeds || []).filter((e) => e.id !== embedId);
  if (post.embeds.length === before) return { ok: false, reason: "embed_not_found" };
  post.updatedAt = Date.now();
  return { ok: true, post };
}

export function summarizeBulletin(state) {
  const n = state.posts.length;
  const pinned = state.posts.filter((p) => p.pin).length;
  const withAtt = state.posts.filter((p) => (p.embeds || []).length > 0).length;
  if (!n) return "Bulletin empty";
  return `${n} post(s)${pinned ? `, ${pinned} pinned` : ""}${withAtt ? `, ${withAtt} with attachments` : ""}`;
}
