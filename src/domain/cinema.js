/**
 * Shared street cinema — pool symbolic credits to unlock a screening.
 * Co-watching with friends lowers the individual contribution.
 * Purchased screenings can invite friends to watch together.
 */

export const CINEMA_POOL_TARGET = 10;
export const CINEMA_BASE_CONTRIBUTION = 2;
export const CINEMA_FRIEND_CONTRIBUTION = 1;

/** Max guests a purchaser can invite to a private/group screening. */
export const CINEMA_MAX_INVITES = 12;

export const FILMS = [
  { id: "premiere-aurora", title: "Aurora Night", kind: "premiere", poolTarget: 10, buyPrice: 5 },
  { id: "classic-orbit", title: "Orbit Days", kind: "classic", poolTarget: 6, buyPrice: 3 },
  { id: "doc-city", title: "City of Rooms", kind: "documentary", poolTarget: 8, buyPrice: 4 }
];

export function createCinemaState(seed = {}) {
  return {
    filmId: seed.filmId || "premiere-aurora",
    contributions: { ...(seed.contributions || {}) },
    active: Boolean(seed.active),
    activatedAt: seed.activatedAt || null,
    viewers: Array.isArray(seed.viewers) ? [...seed.viewers] : [],
    /** Private purchase path */
    purchasedBy: seed.purchasedBy || null,
    purchasePrice: seed.purchasePrice ?? null,
    /** Pending + accepted invites: { userId, status: invited|accepted|declined } */
    invites: Array.isArray(seed.invites)
      ? seed.invites.map((i) => ({ ...i }))
      : []
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

export function suggestedContribution(isFriendGroup) {
  return isFriendGroup ? CINEMA_FRIEND_CONTRIBUTION : CINEMA_BASE_CONTRIBUTION;
}

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

/**
 * Buy a film screening for yourself (affordable fixed price), then invite friends.
 */
export function purchaseScreening(state, buyerId, { filmId = null, creditsAvailable = Infinity } = {}) {
  if (state.active) return { ok: false, reason: "already_active" };
  if (filmId) {
    if (!getFilm(filmId)) return { ok: false, reason: "unknown_film" };
    state.filmId = filmId;
  }
  const film = getFilm(state.filmId);
  const price = film.buyPrice ?? 5;
  if (creditsAvailable < price) return { ok: false, reason: "insufficient_credits" };
  state.purchasedBy = String(buyerId);
  state.purchasePrice = price;
  state.active = true;
  state.activatedAt = Date.now();
  state.viewers = [String(buyerId)];
  state.invites = [];
  state.contributions = { [buyerId]: price };
  return { ok: true, state, price, film };
}

/**
 * Invite friends to watch a purchased (or pool-activated) screening.
 */
export function inviteFriendsToWatch(state, hostId, friendIds = []) {
  if (!state.active) return { ok: false, reason: "no_active_screening" };
  const host = String(hostId);
  // Host must be purchaser or already a viewer/contributor
  const isHost =
    state.purchasedBy === host ||
    state.viewers.includes(host) ||
    state.contributions[host] != null;
  if (!isHost) return { ok: false, reason: "not_host" };

  const added = [];
  for (const raw of friendIds) {
    const id = String(raw).slice(0, 64);
    if (!id || id === host) continue;
    if (state.invites.length + added.length >= CINEMA_MAX_INVITES) break;
    const existing = state.invites.find((i) => i.userId === id);
    if (existing) continue;
    if (state.viewers.includes(id)) continue;
    state.invites.push({ userId: id, status: "invited", invitedAt: Date.now() });
    added.push(id);
  }
  return { ok: true, added, invites: state.invites.map((i) => ({ ...i })) };
}

export function respondToCinemaInvite(state, userId, accept = true) {
  const inv = state.invites.find((i) => i.userId === String(userId));
  if (!inv) return { ok: false, reason: "no_invite" };
  if (!state.active) return { ok: false, reason: "screening_ended" };
  inv.status = accept ? "accepted" : "declined";
  inv.respondedAt = Date.now();
  if (accept) {
    if (!state.viewers.includes(inv.userId)) state.viewers.push(inv.userId);
  }
  return { ok: true, invite: { ...inv }, viewers: [...state.viewers] };
}

export function listCinemaInvites(state, { status } = {}) {
  let list = (state.invites || []).map((i) => ({ ...i }));
  if (status) list = list.filter((i) => i.status === status);
  return list;
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
  state.purchasedBy = null;
  state.purchasePrice = null;
  state.invites = [];
  return state;
}

export function selectFilm(state, filmId) {
  if (state.active) return false;
  if (!getFilm(filmId)) return false;
  state.filmId = filmId;
  state.contributions = {};
  state.viewers = [];
  state.invites = [];
  state.purchasedBy = null;
  return true;
}

export function coWatchBenefits(viewerCount, isFriendGroup) {
  const benefits = [];
  if (viewerCount >= 2) benefits.push("shared reactions");
  if (isFriendGroup) benefits.push("friend discount");
  if (viewerCount >= 3) benefits.push("group chat during film");
  if (viewerCount >= 4) benefits.push("premiere badge");
  return benefits;
}
