/** Local account layer v0.1 — no server auth. Stable subjectId + display name. */

const ACCOUNTS_KEY = "eworld.accounts.v1";
const SESSION_KEY = "eworld.session.v1";
const LEGACY_IDENTITY_KEY = "eworld.identity";
const LEGACY_PROFILE_KEY = "yugatn-eworld-profile-v1";

export function createSubjectId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return "u_" + crypto.randomUUID();
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function sanitizeDisplayName(name) {
  const n = String(name || "Guest").replace(/[^\p{L}\p{N}\s._-]/gu, "").trim().slice(0, 24);
  return n || "Guest";
}

export function createAccount(seed = {}) {
  const now = Date.now();
  return {
    subjectId: seed.subjectId || createSubjectId(),
    displayName: sanitizeDisplayName(seed.displayName || "Guest"),
    avatar: String(seed.avatar || "default").slice(0, 32),
    mode: seed.mode === "guest" ? "guest" : "account",
    createdAt: seed.createdAt || now,
    lastSeenAt: seed.lastSeenAt || now
  };
}

export function createGuestSession() {
  return createAccount({ displayName: "Guest", mode: "guest", subjectId: "guest-local" });
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Migrate old single-profile keys into the accounts registry once. */
export function migrateLegacyIdentity() {
  const accounts = readJson(ACCOUNTS_KEY, null);
  if (accounts && typeof accounts === "object" && Object.keys(accounts).length) return;

  let seed = null;
  try {
    const legacy = localStorage.getItem(LEGACY_IDENTITY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed?.displayName || parsed?.subjectId) {
        seed = {
          subjectId: parsed.subjectId && parsed.subjectId !== "local-guest" ? parsed.subjectId : createSubjectId(),
          displayName: parsed.displayName || "Guest",
          avatar: parsed.avatar || "default",
          mode: "account"
        };
      }
    }
  } catch {}
  if (!seed) {
    try {
      const profile = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (profile) {
        const parsed = JSON.parse(profile);
        if (parsed?.name) {
          seed = {
            subjectId: createSubjectId(),
            displayName: parsed.name,
            avatar: parsed.avatar || "default",
            mode: "account"
          };
        }
      }
    } catch {}
  }
  if (seed) {
    const account = createAccount(seed);
    writeJson(ACCOUNTS_KEY, { [account.subjectId]: account });
    writeJson(SESSION_KEY, {
      subjectId: account.subjectId,
      displayName: account.displayName,
      avatar: account.avatar,
      mode: account.mode
    });
  }
}

export function listAccounts() {
  migrateLegacyIdentity();
  const map = readJson(ACCOUNTS_KEY, {});
  return Object.values(map).filter((a) => a && a.mode !== "guest").sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
}

export function getAccount(subjectId) {
  const map = readJson(ACCOUNTS_KEY, {});
  return map[subjectId] || null;
}

export function saveAccount(account) {
  const map = readJson(ACCOUNTS_KEY, {});
  map[account.subjectId] = { ...account, lastSeenAt: Date.now() };
  writeJson(ACCOUNTS_KEY, map);
  return map[account.subjectId];
}

export function deleteAccount(subjectId) {
  const map = readJson(ACCOUNTS_KEY, {});
  delete map[subjectId];
  writeJson(ACCOUNTS_KEY, map);
  const session = getSession();
  if (session.subjectId === subjectId) signOut();
  return true;
}

export function getSession() {
  migrateLegacyIdentity();
  const session = readJson(SESSION_KEY, null);
  if (session && session.subjectId) {
    return {
      subjectId: session.subjectId,
      displayName: sanitizeDisplayName(session.displayName),
      avatar: String(session.avatar || "default").slice(0, 32),
      mode: session.mode === "guest" ? "guest" : "account"
    };
  }
  return createGuestSession();
}

export function setSession(account) {
  const session = {
    subjectId: account.subjectId,
    displayName: sanitizeDisplayName(account.displayName),
    avatar: String(account.avatar || "default").slice(0, 32),
    mode: account.mode === "guest" ? "guest" : "account"
  };
  writeJson(SESSION_KEY, session);
  if (session.mode === "account") {
    saveAccount({ ...account, ...session });
  }
  return session;
}

/** Create a named local account and sign in. */
export function registerAccount(displayName, avatar = "default") {
  const account = createAccount({
    displayName,
    avatar,
    mode: "account"
  });
  saveAccount(account);
  return setSession(account);
}

/** Switch to an existing local account. */
export function signIn(subjectId) {
  const account = getAccount(subjectId);
  if (!account) return null;
  account.lastSeenAt = Date.now();
  saveAccount(account);
  return setSession(account);
}

/** Return to guest mode without deleting accounts. */
export function signOut() {
  return setSession(createGuestSession());
}

export function updateSessionProfile({ displayName, avatar } = {}) {
  const session = getSession();
  if (displayName != null) session.displayName = sanitizeDisplayName(displayName);
  if (avatar != null) session.avatar = String(avatar).slice(0, 32);
  if (session.mode === "account") {
    const account = getAccount(session.subjectId);
    if (account) {
      account.displayName = session.displayName;
      account.avatar = session.avatar;
      saveAccount(account);
    }
  }
  return setSession(session);
}

/** Compatibility helpers used by older modules. */
export function createSocialIdentity(seed = {}) {
  return createAccount({
    subjectId: seed.subjectId || "local-guest",
    displayName: seed.displayName || "Guest",
    avatar: seed.avatar || "default",
    mode: seed.subjectId && seed.subjectId !== "local-guest" ? "account" : "guest"
  });
}

export function loadIdentity() {
  return getSession();
}

export function saveIdentity(identity) {
  return setSession(createAccount(identity));
}
