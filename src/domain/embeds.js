/**
 * Safe embed descriptors for YouTube + Google Docs / Sheets / Slides.
 * Pure URL parse → display metadata (no network fetch).
 */

export const EMBED_TYPES = Object.freeze([
  "youtube",
  "google_docs",
  "google_sheets",
  "google_slides",
  "link"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Extract YouTube video id from common URL forms. */
export function parseYouTubeId(url) {
  const s = String(url || "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname.startsWith("/watch")) {
        const id = u.searchParams.get("v");
        return id && /^[\w-]{6,}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|v)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Parse Google Docs / Sheets / Slides file id and kind. */
export function parseGoogleWorkspace(url) {
  const s = String(url || "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "docs.google.com" && host !== "drive.google.com") return null;
    // /document/d/ID · /spreadsheets/d/ID · /presentation/d/ID
    let m = u.pathname.match(/\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
    if (m) {
      const kind =
        m[1] === "document" ? "google_docs" : m[1] === "spreadsheets" ? "google_sheets" : "google_slides";
      return { type: kind, fileId: m[2] };
    }
    // drive open?id=
    if (host === "drive.google.com") {
      const id = u.searchParams.get("id");
      if (id && /^[\w-]+$/.test(id)) return { type: "link", fileId: id };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Normalize any supported URL into an embed descriptor.
 * @returns {{ type, title, sourceUrl, embedUrl, videoId?, fileId? } | null}
 */
export function parseEmbedUrl(url, title = "") {
  const raw = String(url || "").trim().slice(0, 500);
  if (!raw) return null;

  const yt = parseYouTubeId(raw);
  if (yt) {
    return {
      type: "youtube",
      title: String(title || "YouTube video").slice(0, 120),
      sourceUrl: raw,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      videoId: yt,
      fileId: null
    };
  }

  const g = parseGoogleWorkspace(raw);
  if (g) {
    const labels = {
      google_docs: "Google Doc",
      google_sheets: "Google Sheet",
      google_slides: "Google Slides",
      link: "Google Drive"
    };
    let embedUrl = raw;
    if (g.type === "google_docs") {
      embedUrl = `https://docs.google.com/document/d/${g.fileId}/preview`;
    } else if (g.type === "google_sheets") {
      embedUrl = `https://docs.google.com/spreadsheets/d/${g.fileId}/preview`;
    } else if (g.type === "google_slides") {
      embedUrl = `https://docs.google.com/presentation/d/${g.fileId}/embed?start=false&loop=false&delayms=3000`;
    }
    return {
      type: g.type,
      title: String(title || labels[g.type] || "Document").slice(0, 120),
      sourceUrl: raw,
      embedUrl,
      videoId: null,
      fileId: g.fileId
    };
  }

  // Generic https link (display only, not iframe-forced)
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" || u.protocol === "http:") {
      return {
        type: "link",
        title: String(title || u.hostname).slice(0, 120),
        sourceUrl: raw,
        embedUrl: null,
        videoId: null,
        fileId: null
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function createEmbedsState(seed = {}) {
  return {
    items: Array.isArray(seed.items)
      ? seed.items.map((e) => ({ ...e }))
      : []
  };
}

export function attachEmbed(state, { url, title = "", attachedTo = null, createdBy = null } = {}) {
  const parsed = parseEmbedUrl(url, title);
  if (!parsed) return { ok: false, reason: "unsupported_url" };
  const item = {
    id: uid("emb"),
    ...parsed,
    attachedTo: attachedTo ? String(attachedTo).slice(0, 64) : null,
    createdBy: createdBy ? String(createdBy).slice(0, 64) : null,
    createdAt: Date.now()
  };
  state.items.push(item);
  return { ok: true, embed: item };
}

export function removeEmbed(state, embedId) {
  const before = state.items.length;
  state.items = state.items.filter((e) => e.id !== embedId);
  return before !== state.items.length;
}

export function listEmbeds(state, { type, attachedTo } = {}) {
  let list = state.items.map((e) => ({ ...e }));
  if (type) list = list.filter((e) => e.type === type);
  if (attachedTo) list = list.filter((e) => e.attachedTo === attachedTo);
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getEmbed(state, embedId) {
  return state.items.find((e) => e.id === embedId) || null;
}

/** UI helper: iframe-safe src only for known providers. */
export function embedDisplay(embed) {
  if (!embed) return null;
  return {
    id: embed.id,
    type: embed.type,
    title: embed.title,
    sourceUrl: embed.sourceUrl,
    canIframe: Boolean(embed.embedUrl),
    iframeSrc: embed.embedUrl || null,
    openUrl: embed.sourceUrl
  };
}

export function summarizeEmbeds(state) {
  const n = state.items.length;
  if (!n) return "No embeds";
  const by = {};
  for (const e of state.items) by[e.type] = (by[e.type] || 0) + 1;
  return Object.entries(by)
    .map(([t, c]) => `${c} ${t}`)
    .join(", ");
}
