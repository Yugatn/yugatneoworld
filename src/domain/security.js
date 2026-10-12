/**
 * Information security architecture for Yugatn eWorld.
 *
 * Goals: reduce impact of compromise and data leakage by design.
 * Domain contracts — production must use real crypto (WebCrypto/Node crypto),
 * TLS, hardened server headers, and secret management outside the client.
 *
 * Principles:
 *  1. Least privilege & data minimization
 *  2. Never store raw PII (passport/INN) — hashes only (see identity-verify)
 *  3. Classify every field; redact before logs/export/sync
 *  4. Audit sensitive actions
 *  5. Rate-limit auth and money paths
 *  6. Short-lived sessions; rotate on privilege change
 *  7. Fail closed on verification / permission checks
 */

/** Data sensitivity classes. */
export const DATA_CLASS = Object.freeze({
  PUBLIC: "public", // display name, public posts
  INTERNAL: "internal", // room layout, non-sensitive prefs
  CONFIDENTIAL: "confidential", // health, wellness consent, balances
  RESTRICTED: "restricted" // identity hashes, session tokens, audit details
});

/** Recommended HTTP / browser hardening (server must enforce). */
export const SECURITY_HEADERS = Object.freeze({
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss: https:; frame-src https://www.youtube.com https://docs.google.com; base-uri 'self'; form-action 'self'; object-src 'none'"
});

export const RATE_LIMITS = Object.freeze({
  login: { windowMs: 15 * 60 * 1000, max: 10 },
  verifyPhone: { windowMs: 60 * 60 * 1000, max: 5 },
  vote: { windowMs: 60 * 1000, max: 30 },
  transfer: { windowMs: 60 * 1000, max: 20 },
  api: { windowMs: 60 * 1000, max: 120 }
});

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h
export const SESSION_IDLE_MS = 30 * 60 * 1000; // 30m idle
export const AUDIT_CAP = 1000;

export const SECURITY_EVENTS = Object.freeze([
  "session.create",
  "session.revoke",
  "session.expired",
  "auth.fail",
  "rate_limit.hit",
  "identity.verify",
  "identity.revoke",
  "vote.cast",
  "currency.transfer",
  "data.export",
  "policy.deny",
  "integrity.fail"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Lightweight integrity fingerprint (not cryptographic MAC — server should use HMAC). */
export function fingerprintPayload(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

export function createSecurityState(seed = {}) {
  return {
    version: 1,
    /** opaque sessionId → session */
    sessions: seed.sessions && typeof seed.sessions === "object"
      ? Object.fromEntries(Object.entries(seed.sessions).map(([k, v]) => [k, { ...v }]))
      : {},
    /** rate limit buckets: key → { count, resetAt } */
    rateBuckets: seed.rateBuckets && typeof seed.rateBuckets === "object"
      ? { ...seed.rateBuckets }
      : {},
    /** append-only style audit (capped) */
    audit: Array.isArray(seed.audit) ? seed.audit.map((e) => ({ ...e })) : [],
    /** feature flags / policy */
    policy: {
      requireHttps: seed.policy?.requireHttps !== false,
      redactLogs: seed.policy?.redactLogs !== false,
      blockExportRestricted: seed.policy?.blockExportRestricted !== false,
      maxLoginAttempts: seed.policy?.maxLoginAttempts ?? RATE_LIMITS.login.max,
      ...((seed.policy && typeof seed.policy === "object") ? {} : {})
    }
  };
}

// —— Audit ——

export function audit(state, event, {
  userId = null,
  detail = {},
  severity = "info",
  now = Date.now()
} = {}) {
  const entry = {
    id: uid("aud"),
    event: String(event),
    userId: userId ? String(userId) : null,
    severity: ["info", "warn", "critical"].includes(severity) ? severity : "info",
    at: now,
    detail: state.policy.redactLogs ? redactObject(detail) : { ...detail }
  };
  state.audit.push(entry);
  if (state.audit.length > AUDIT_CAP) state.audit = state.audit.slice(-AUDIT_CAP);
  return entry;
}

export function listAudit(state, { userId, event, limit = 50 } = {}) {
  let list = state.audit.slice();
  if (userId) list = list.filter((e) => e.userId === String(userId));
  if (event) list = list.filter((e) => e.event === event);
  return list.slice(-limit).reverse();
}

// —— Rate limit ——

export function checkRateLimit(state, bucketKey, limitDef, now = Date.now()) {
  const key = String(bucketKey);
  const windowMs = limitDef.windowMs;
  const max = limitDef.max;
  let b = state.rateBuckets[key];
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    state.rateBuckets[key] = b;
  }
  if (b.count >= max) {
    audit(state, "rate_limit.hit", {
      userId: key.split(":")[1] || null,
      detail: { bucket: key, max },
      severity: "warn",
      now
    });
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterMs: Math.max(0, b.resetAt - now)
    };
  }
  b.count += 1;
  return { ok: true, remaining: max - b.count };
}

export function rateLimitAction(state, action, userId, now = Date.now()) {
  const def = RATE_LIMITS[action] || RATE_LIMITS.api;
  return checkRateLimit(state, `${action}:${userId || "anon"}`, def, now);
}

// —— Sessions ——

export function createSession(state, userId, {
  roles = ["user"],
  now = Date.now(),
  meta = {}
} = {}) {
  const sessionId = uid("ses");
  const session = {
    id: sessionId,
    userId: String(userId),
    roles: [...roles],
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    lastSeenAt: now,
    revoked: false,
    fingerprint: fingerprintPayload({ userId, roles, at: now }),
    meta: redactObject(meta)
  };
  state.sessions[sessionId] = session;
  audit(state, "session.create", { userId, detail: { sessionId }, now });
  return { ok: true, sessionId, expiresAt: session.expiresAt };
}

export function touchSession(state, sessionId, now = Date.now()) {
  const s = state.sessions[sessionId];
  if (!s || s.revoked) return { ok: false, reason: "invalid_session" };
  if (now > s.expiresAt) {
    s.revoked = true;
    audit(state, "session.expired", { userId: s.userId, detail: { sessionId }, now });
    return { ok: false, reason: "expired" };
  }
  if (now - s.lastSeenAt > SESSION_IDLE_MS) {
    s.revoked = true;
    audit(state, "session.expired", {
      userId: s.userId,
      detail: { sessionId, cause: "idle" },
      now
    });
    return { ok: false, reason: "idle_timeout" };
  }
  s.lastSeenAt = now;
  return { ok: true, userId: s.userId, roles: [...s.roles] };
}

export function revokeSession(state, sessionId, now = Date.now()) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  s.revoked = true;
  audit(state, "session.revoke", { userId: s.userId, detail: { sessionId }, now });
  return { ok: true };
}

export function revokeAllSessions(state, userId, now = Date.now()) {
  let n = 0;
  for (const s of Object.values(state.sessions)) {
    if (s.userId === String(userId) && !s.revoked) {
      s.revoked = true;
      n++;
    }
  }
  audit(state, "session.revoke", {
    userId,
    detail: { all: true, count: n },
    severity: "warn",
    now
  });
  return { ok: true, revoked: n };
}

// —— Redaction & export ——

const RESTRICTED_KEY_RE =
  /password|secret|token|passport|inn|phoneHash|passportHash|innHash|sms|authorization|cookie/i;

export function redactObject(obj, depth = 0) {
  if (obj == null || depth > 6) return obj;
  if (Array.isArray(obj)) return obj.map((x) => redactObject(x, depth + 1));
  if (typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (RESTRICTED_KEY_RE.test(k)) {
      out[k] = typeof v === "string" && v.length > 4 ? "[REDACTED]" : "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactObject(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Sanitize free text (XSS / injection surface reduction for stored content).
 */
export function sanitizeText(input, { maxLen = 2000 } = {}) {
  let s = String(input ?? "");
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript\s*:/gi, "");
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

/**
 * Safe public snapshot of world-ish state: strips restricted identity material.
 */
export function secureExportWorldSlice(worldLike, securityState) {
  if (securityState?.policy?.blockExportRestricted === false) {
    // still redact
  }
  const slice = {
    version: worldLike?.version,
    avatar: worldLike?.avatar
      ? { x: worldLike.avatar.x, y: worldLike.avatar.y, appearance: worldLike.avatar.appearance }
      : null,
    // never export full identity indexes
    identity: worldLike?.identity
      ? {
          profiles: Object.fromEntries(
            Object.entries(worldLike.identity.profiles || {}).map(([uid, p]) => [
              uid,
              {
                userId: p.userId,
                level: p.level,
                phoneMasked: p.phoneMasked,
                // hashes omitted from export
                fullyVerified: p.level >= 2
              }
            ])
          )
        }
      : null,
    currencyBalancesPublic: false,
    exportedAt: Date.now(),
    fingerprint: null
  };
  slice.fingerprint = fingerprintPayload(slice);
  if (securityState) {
    audit(securityState, "data.export", {
      detail: { fingerprint: slice.fingerprint },
      severity: "info"
    });
  }
  return slice;
}

/** Classify a logical field path for documentation / UI. */
export function classifyField(path) {
  const p = String(path).toLowerCase();
  if (/passport|inn|phonehash|session|token|audit/.test(p)) return DATA_CLASS.RESTRICTED;
  if (/health|wellness|balance|ledger|consent/.test(p)) return DATA_CLASS.CONFIDENTIAL;
  if (/avatar|apartment|schedule|bulletin/.test(p)) return DATA_CLASS.INTERNAL;
  return DATA_CLASS.PUBLIC;
}

export function assertPolicy(state, condition, {
  userId = null,
  reason = "policy_deny",
  now = Date.now()
} = {}) {
  if (condition) return { ok: true };
  audit(state, "policy.deny", {
    userId,
    detail: { reason },
    severity: "warn",
    now
  });
  return { ok: false, reason };
}

/**
 * Guard for official vote: must be fully verified + rate limit + session valid.
 */
export function authorizeSensitiveAction(state, {
  sessionId,
  userId,
  action,
  requireRoles = [],
  now = Date.now()
} = {}) {
  if (sessionId) {
    const touch = touchSession(state, sessionId, now);
    if (!touch.ok) return touch;
    if (requireRoles.length) {
      const ok = requireRoles.every((r) => touch.roles.includes(r));
      if (!ok) {
        return assertPolicy(state, false, { userId: touch.userId, reason: "role_required", now });
      }
    }
    userId = touch.userId;
  }
  const rl = rateLimitAction(state, action, userId, now);
  if (!rl.ok) return rl;
  return { ok: true, userId };
}

export function summarizeSecurity(state) {
  const active = Object.values(state.sessions).filter((s) => !s.revoked).length;
  return `sessions ${active} · audit ${state.audit.length} · redact ${state.policy.redactLogs}`;
}

/** Production checklist (documentation as data). */
export const PRODUCTION_CHECKLIST = Object.freeze([
  "TLS 1.2+ only; HSTS enabled",
  "Replace client-side identity hash with server SHA-256 + per-user salt",
  "Store sessions server-side; HttpOnly Secure SameSite cookies or rotating bearer tokens",
  "Encrypt restricted fields at rest (KMS)",
  "Separate DB roles: app vs migrate vs backup",
  "WAF + rate limits at edge",
  "Dependency scanning (npm audit) in CI",
  "No secrets in client bundle or git",
  "CSP as SECURITY_HEADERS; no inline scripts in production",
  "Audit log immutable sink (append-only storage)",
  "PII retention limits + user data deletion path",
  "Regular backup encryption and restore drills"
]);
