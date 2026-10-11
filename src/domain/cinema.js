/**
 * Shared street cinema — pool symbolic credits to unlock a screening.
 * Co-watching with friends lowers the individual contribution.
 */

export const CINEMA_POOL_TARGET = 10;
export const CINEMA_BASE_CONTRIBUTION = 2;
export const CINEMA_FRIEND_CONTRIBUTION = 1;

export const FILMS = [
  { id: "premiere-aurora", title: "Aurora Night", kind: "premiere", poolTarget: 10 },
  { id: "classic-orbit", title: "Orbit Days", kind: "classic", poolTarget: 6 },
  { id: "doc-city", title: "City of Rooms", kind: "documentary", poolTarget: 8 }
];

export function createCinemaState(seed = {}) {
  return {
    filmId: seed.filmId || "premiere-aurora",
    contributions: { ...(seed.contributions || {}) },
    active: Boolean(seed.active),
    activatedAt: seed.activatedAt || null,
    viewers: Array.isArray(seed.viewers) ? [...seed.viewers] : []
  };
}

export function getFilm(filmId) {
  return FILMS.find((f) => f.id === filmId) || FILMS[0];
}

export function poolTotal(state) {
  return Object.values(state.contributions).reduce((s, n) => s + (Number(n) || 0), 0);
}

export function poolTarget(state) {
  return getFilm(state.filmId).poolTarget || CINEMA_POOL_TARGET;
}

export function poolProgress(state) {
  const target = poolTarget(state);
  const total = poolTotal(state);
  return { total, target, ratio: target ? Math.min(1, total / target) : 0, remaining: Math.max(0, target - total) };
}

/** Suggested contribution: friends pay less for co-watch advantage. */
export function suggestedContribution(isFriendGroup) {
  return isFriendGroup ? CINEMA_FRIEND_CONTRIBUTION : CINEMA_BASE_CONTRIBUTION;
}

/**
 * Contribute credits toward the current film.
 * Returns { ok, state, activated, progress } or { ok:false, reason }.
 */
export function contribute(state, userId, amount, { isFriendGroup = false, creditsAvailable = Infinity } = {}) {
  if (state.active) return { ok: false, reason: "already_active", state };
  const want = Math.max(1, Math.min(5, Number(amount) || suggestedContribution(isFriendGroup)));
  if (creditsAvailable < want) return { ok: false, reason: "insufficient_credits", state };
  const prev = Number(state.contributions[userId] || 0);
  state.contributions[userId] = prev + want;
  if (!state.viewers.includes(userId)) state.viewers.push(userId);
  const progress = poolProgress(state);
  let activated = false;
  if (progress.total >= progress.target) {
    state.active = true;
    state.activatedAt = Date.now();
    activated = true;
  }
  return { ok: true, state, amount: want, activated, progress: poolProgress(state) };
}

export function joinScreening(state, userId) {
  if (!state.active) return false;
  if (!state.viewers.includes(userId)) state.viewers.push(userId);
  return true;
}

export function endScreening(state) {
  state.active = false;
  state.activatedAt = null;
  state.contributions = {};
  state.viewers = [];
  return state;
}

export function selectFilm(state, filmId) {
  if (state.active) return false;
  if (!getFilm(filmId)) return false;
  state.filmId = filmId;
  state.contributions = {};
  state.viewers = [];
  return true;
}

/** Co-watch bonus label for UI. */
export function coWatchBenefits(viewerCount, isFriendGroup) {
  const benefits = [];
  if (viewerCount >= 2) benefits.push("shared reactions");
  if (isFriendGroup) benefits.push("friend discount");
  if (viewerCount >= 3) benefits.push("group chat during film");
  if (viewerCount >= 4) benefits.push("premiere badge");
  return benefits;
}
