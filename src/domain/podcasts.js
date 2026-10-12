/**
 * Podcast playback & live broadcast inside eWorld.
 * Solo listen at home (player / sofa) or host a live stream and invite friends.
 * No real audio CDN in v0.1 — domain models session + metadata; UI binds media URLs.
 */

export const PLAYBACK_STATUSES = Object.freeze([
  "idle",
  "playing",
  "paused",
  "live"
]);

export const MAX_LIVE_LISTENERS = 40;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Sample catalog — free / affordable shows. */
export const PODCAST_CATALOG = Object.freeze([
  {
    id: "show-city-rooms",
    title: "City of Rooms",
    titleRu: "Город комнат",
    author: "Yugatn Radio",
    language: "ru",
    episodes: [
      {
        id: "ep-cr-1",
        title: "Входная дверь",
        durationSec: 18 * 60,
        audioUrl: "https://example.com/podcasts/city-rooms/ep1.mp3",
        publishedAt: "2026-01-10"
      },
      {
        id: "ep-cr-2",
        title: "Умный дом без шума",
        durationSec: 22 * 60,
        audioUrl: "https://example.com/podcasts/city-rooms/ep2.mp3",
        publishedAt: "2026-02-01"
      }
    ]
  },
  {
    id: "show-orbit-talk",
    title: "Orbit Talk",
    titleRu: "Орбита",
    author: "Friends of the Street",
    language: "en",
    episodes: [
      {
        id: "ep-ot-1",
        title: "Co-watching cinema",
        durationSec: 30 * 60,
        audioUrl: "https://example.com/podcasts/orbit/ep1.mp3",
        publishedAt: "2026-03-15"
      }
    ]
  },
  {
    id: "show-school-notes",
    title: "School Notes",
    titleRu: "Школьные заметки",
    author: "Teachers Circle",
    language: "ru",
    episodes: [
      {
        id: "ep-sn-1",
        title: "Расписание без стресса",
        durationSec: 15 * 60,
        audioUrl: "https://example.com/podcasts/school/ep1.mp3",
        publishedAt: "2026-04-01"
      }
    ]
  }
]);

export function createPodcastState(seed = {}) {
  return {
    status: PLAYBACK_STATUSES.includes(seed.status) ? seed.status : "idle",
    showId: seed.showId || null,
    episodeId: seed.episodeId || null,
    positionSec: typeof seed.positionSec === "number" ? seed.positionSec : 0,
    /** Solo or live host */
    hostId: seed.hostId || null,
    listeners: Array.isArray(seed.listeners) ? [...seed.listeners] : [],
    invites: Array.isArray(seed.invites) ? seed.invites.map((i) => ({ ...i })) : [],
    /** showId[] */
    subscriptions: Array.isArray(seed.subscriptions) ? [...seed.subscriptions] : [],
    liveTitle: seed.liveTitle || null,
    liveStartedAt: seed.liveStartedAt || null,
    updatedAt: seed.updatedAt || 0
  };
}

export function listShows() {
  return PODCAST_CATALOG.map((s) => ({
    id: s.id,
    title: s.title,
    titleRu: s.titleRu,
    author: s.author,
    language: s.language,
    episodeCount: s.episodes.length
  }));
}

export function getShow(showId) {
  return PODCAST_CATALOG.find((s) => s.id === showId) || null;
}

export function getEpisode(showId, episodeId) {
  const show = getShow(showId);
  if (!show) return null;
  const ep = show.episodes.find((e) => e.id === episodeId);
  return ep ? { show, episode: { ...ep } } : null;
}

export function listEpisodes(showId) {
  const show = getShow(showId);
  if (!show) return [];
  return show.episodes.map((e) => ({ ...e }));
}

export function subscribe(state, showId) {
  if (!getShow(showId)) return { ok: false, reason: "unknown_show" };
  if (!state.subscriptions.includes(showId)) state.subscriptions.push(showId);
  return { ok: true, subscriptions: [...state.subscriptions] };
}

export function unsubscribe(state, showId) {
  state.subscriptions = state.subscriptions.filter((id) => id !== showId);
  return true;
}

/** Start solo playback of a catalog episode. */
export function playEpisode(state, showId, episodeId, { userId = null, positionSec = 0 } = {}) {
  const hit = getEpisode(showId, episodeId);
  if (!hit) return { ok: false, reason: "not_found" };
  if (state.status === "live") return { ok: false, reason: "live_in_progress" };
  state.status = "playing";
  state.showId = showId;
  state.episodeId = episodeId;
  state.positionSec = Math.max(0, Math.min(hit.episode.durationSec, Number(positionSec) || 0));
  state.hostId = userId ? String(userId) : state.hostId;
  state.listeners = userId ? [String(userId)] : state.listeners;
  state.liveTitle = null;
  state.liveStartedAt = null;
  state.updatedAt = Date.now();
  return {
    ok: true,
    status: state.status,
    show: { id: hit.show.id, title: hit.show.title },
    episode: hit.episode,
    positionSec: state.positionSec,
    audioUrl: hit.episode.audioUrl
  };
}

export function pausePlayback(state) {
  if (state.status !== "playing") return { ok: false, reason: "not_playing" };
  state.status = "paused";
  state.updatedAt = Date.now();
  return { ok: true, status: "paused", positionSec: state.positionSec };
}

export function resumePlayback(state) {
  if (state.status !== "paused") return { ok: false, reason: "not_paused" };
  state.status = "playing";
  state.updatedAt = Date.now();
  return { ok: true, status: "playing", positionSec: state.positionSec };
}

export function seekPlayback(state, positionSec) {
  if (state.status === "idle" || state.status === "live") {
    return { ok: false, reason: "cannot_seek" };
  }
  const hit = state.showId && state.episodeId ? getEpisode(state.showId, state.episodeId) : null;
  const max = hit?.episode?.durationSec ?? 3600;
  state.positionSec = Math.max(0, Math.min(max, Number(positionSec) || 0));
  state.updatedAt = Date.now();
  return { ok: true, positionSec: state.positionSec };
}

export function stopPlayback(state) {
  state.status = "idle";
  state.showId = null;
  state.episodeId = null;
  state.positionSec = 0;
  state.hostId = null;
  state.listeners = [];
  state.invites = [];
  state.liveTitle = null;
  state.liveStartedAt = null;
  state.updatedAt = Date.now();
  return { ok: true, status: "idle" };
}

/**
 * Start a live podcast broadcast (host talks / plays episode on air).
 * Optional episodeId to stream a catalog episode as the bed.
 */
export function startLiveBroadcast(state, hostId, {
  title = "Live podcast",
  showId = null,
  episodeId = null
} = {}) {
  if (state.status === "live") return { ok: false, reason: "already_live" };
  const host = String(hostId || "").slice(0, 64);
  if (!host) return { ok: false, reason: "no_host" };

  if (showId && episodeId) {
    const hit = getEpisode(showId, episodeId);
    if (!hit) return { ok: false, reason: "not_found" };
    state.showId = showId;
    state.episodeId = episodeId;
    state.positionSec = 0;
  } else {
    state.showId = showId || null;
    state.episodeId = null;
    state.positionSec = 0;
  }

  state.status = "live";
  state.hostId = host;
  state.listeners = [host];
  state.invites = [];
  state.liveTitle = String(title || "Live podcast").slice(0, 80);
  state.liveStartedAt = Date.now();
  state.updatedAt = Date.now();
  return {
    ok: true,
    status: "live",
    liveTitle: state.liveTitle,
    hostId: host,
    showId: state.showId,
    episodeId: state.episodeId
  };
}

export function endLiveBroadcast(state, hostId = null) {
  if (state.status !== "live") return { ok: false, reason: "not_live" };
  if (hostId && state.hostId && String(hostId) !== state.hostId) {
    return { ok: false, reason: "not_host" };
  }
  return stopPlayback(state);
}

/** Join live stream as listener. */
export function joinLive(state, userId) {
  if (state.status !== "live") return { ok: false, reason: "not_live" };
  const id = String(userId).slice(0, 64);
  if (!id) return { ok: false, reason: "no_user" };
  if (state.listeners.length >= MAX_LIVE_LISTENERS && !state.listeners.includes(id)) {
    return { ok: false, reason: "full" };
  }
  if (!state.listeners.includes(id)) state.listeners.push(id);
  // accept pending invite if any
  const inv = state.invites.find((i) => i.userId === id);
  if (inv) inv.status = "accepted";
  state.updatedAt = Date.now();
  return { ok: true, listeners: [...state.listeners], count: state.listeners.length };
}

export function leaveLive(state, userId) {
  const id = String(userId);
  state.listeners = state.listeners.filter((u) => u !== id);
  if (state.hostId === id && state.status === "live") {
    return endLiveBroadcast(state, id);
  }
  state.updatedAt = Date.now();
  return { ok: true, listeners: [...state.listeners] };
}

/** Invite friends to current live (or shared listening session). */
export function inviteToPodcast(state, hostId, friendIds = []) {
  if (state.status !== "live" && state.status !== "playing") {
    return { ok: false, reason: "no_session" };
  }
  const host = String(hostId);
  if (state.hostId && state.hostId !== host && !state.listeners.includes(host)) {
    return { ok: false, reason: "not_host" };
  }
  const added = [];
  for (const raw of friendIds) {
    const id = String(raw).slice(0, 64);
    if (!id || id === host) continue;
    if (state.invites.some((i) => i.userId === id)) continue;
    if (state.listeners.includes(id)) continue;
    if (state.invites.length + added.length >= MAX_LIVE_LISTENERS) break;
    state.invites.push({ userId: id, status: "invited", invitedAt: Date.now() });
    added.push(id);
  }
  state.updatedAt = Date.now();
  return { ok: true, added, invites: state.invites.map((i) => ({ ...i })) };
}

export function respondToPodcastInvite(state, userId, accept = true) {
  const inv = state.invites.find((i) => i.userId === String(userId));
  if (!inv) return { ok: false, reason: "no_invite" };
  if (state.status !== "live" && state.status !== "playing") {
    return { ok: false, reason: "session_ended" };
  }
  inv.status = accept ? "accepted" : "declined";
  inv.respondedAt = Date.now();
  if (accept) {
    if (!state.listeners.includes(inv.userId)) state.listeners.push(inv.userId);
  }
  return { ok: true, invite: { ...inv }, listeners: [...state.listeners] };
}

export function nowPlaying(state) {
  if (state.status === "idle") return null;
  const hit =
    state.showId && state.episodeId ? getEpisode(state.showId, state.episodeId) : null;
  return {
    status: state.status,
    liveTitle: state.liveTitle,
    hostId: state.hostId,
    listenerCount: state.listeners.length,
    positionSec: state.positionSec,
    show: hit
      ? { id: hit.show.id, title: hit.show.title, titleRu: hit.show.titleRu }
      : state.showId
        ? { id: state.showId, title: null }
        : null,
    episode: hit ? { ...hit.episode } : null,
    audioUrl: hit?.episode?.audioUrl || null
  };
}

export function summarizePodcasts(state) {
  if (state.status === "live") {
    return `LIVE: ${state.liveTitle || "podcast"} · ${state.listeners.length} listener(s)`;
  }
  if (state.status === "playing" || state.status === "paused") {
    const hit = state.showId && state.episodeId ? getEpisode(state.showId, state.episodeId) : null;
    const title = hit?.episode?.title || state.episodeId || "episode";
    return `${state.status}: ${title}`;
  }
  const sub = state.subscriptions.length;
  return sub ? `Idle · ${sub} subscription(s)` : "No podcast playing";
}
