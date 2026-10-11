/**
 * Temporary apartment keys — host grants a guest timed access
 * to enter and use media / games even if the door is closed.
 */

export const KEY_PERMISSIONS = Object.freeze(["visit", "media", "games"]);

export const KEY_DURATIONS_MS = Object.freeze({
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000
});

export function createKeyState(seed = {}) {
  return {
    /** Keys this host has granted to others */
    granted: Array.isArray(seed.granted) ? seed.granted.map((k) => ({ ...k })) : [],
    /** Keys this user received from hosts */
    received: Array.isArray(seed.received) ? seed.received.map((k) => ({ ...k })) : []
  };
}

function normalizePermissions(list) {
  const set = new Set(KEY_PERMISSIONS);
  const out = (Array.isArray(list) ? list : KEY_PERMISSIONS)
    .map(String)
    .filter((p) => set.has(p));
  if (!out.includes("visit")) out.unshift("visit");
  return [...new Set(out)];
}

/**
 * Grant a temporary key from host to guest.
 * Returns the key object or null if invalid.
 */
export function grantKey(state, {
  hostId,
  guestId,
  hostName = "Host",
  guestName = "Guest",
  durationMs = KEY_DURATIONS_MS["1h"],
  permissions = KEY_PERMISSIONS,
  now = Date.now()
} = {}) {
  if (!hostId || !guestId || hostId === guestId) return null;
  const ms = Math.max(60_000, Math.min(7 * 24 * 60 * 60 * 1000, Number(durationMs) || KEY_DURATIONS_MS["1h"]));
  const key = {
    id: `key_${hostId.slice(0, 8)}_${guestId.slice(0, 8)}_${now.toString(36)}`,
    hostId: String(hostId),
    guestId: String(guestId),
    hostName: String(hostName).slice(0, 24),
    guestName: String(guestName).slice(0, 24),
    permissions: normalizePermissions(permissions),
    grantedAt: now,
    expiresAt: now + ms
  };
  // Replace any existing grant to the same guest
  state.granted = state.granted.filter((k) => k.guestId !== key.guestId || k.hostId !== key.hostId);
  state.granted.push(key);
  return key;
}

export function receiveKey(state, key) {
  if (!key?.id || !key.guestId) return state;
  state.received = state.received.filter((k) => k.id !== key.id && !(k.hostId === key.hostId && k.guestId === key.guestId));
  state.received.push({ ...key });
  return state;
}

export function revokeKey(state, keyId) {
  const before = state.granted.length + state.received.length;
  state.granted = state.granted.filter((k) => k.id !== keyId);
  state.received = state.received.filter((k) => k.id !== keyId);
  return before !== state.granted.length + state.received.length;
}

export function revokeKeysForGuest(state, guestId) {
  state.granted = state.granted.filter((k) => k.guestId !== guestId);
  return state;
}

export function purgeExpired(state, now = Date.now()) {
  state.granted = state.granted.filter((k) => k.expiresAt > now);
  state.received = state.received.filter((k) => k.expiresAt > now);
  return state;
}

export function isKeyValid(key, now = Date.now()) {
  return Boolean(key && key.expiresAt > now && Array.isArray(key.permissions) && key.permissions.length);
}

/** Does guest hold a valid key from host (optionally requiring a permission)? */
export function hasValidKey(state, guestId, hostId, permission = null, now = Date.now()) {
  const pools = [...(state.granted || []), ...(state.received || [])];
  return pools.some((k) => {
    if (k.guestId !== guestId || k.hostId !== hostId) return false;
    if (!isKeyValid(k, now)) return false;
    if (permission && !k.permissions.includes(permission)) return false;
    return true;
  });
}

export function findKey(state, guestId, hostId, now = Date.now()) {
  const pools = [...(state.granted || []), ...(state.received || [])];
  return pools.find((k) => k.guestId === guestId && k.hostId === hostId && isKeyValid(k, now)) || null;
}

export function listActiveGranted(state, hostId, now = Date.now()) {
  purgeExpired(state, now);
  return state.granted.filter((k) => k.hostId === hostId && isKeyValid(k, now));
}

export function listActiveReceived(state, guestId, now = Date.now()) {
  purgeExpired(state, now);
  return state.received.filter((k) => k.guestId === guestId && isKeyValid(k, now));
}

export function remainingMs(key, now = Date.now()) {
  if (!key) return 0;
  return Math.max(0, key.expiresAt - now);
}

export function formatRemaining(key, now = Date.now()) {
  const ms = remainingMs(key, now);
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Guest may use apartment media (TV / cinema / music) with a valid media key. */
export function canUseMedia(state, guestId, hostId, now = Date.now()) {
  return hasValidKey(state, guestId, hostId, "media", now);
}

/** Guest may play games in the apartment with a valid games key. */
export function canPlayGames(state, guestId, hostId, now = Date.now()) {
  return hasValidKey(state, guestId, hostId, "games", now);
}
