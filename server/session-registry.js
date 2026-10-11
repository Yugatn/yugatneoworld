import { createHash, randomBytes } from "node:crypto";

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const MAX_TTL_MS = 24 * 60 * 60 * 1000;
const SUBJECT_ID_PATTERN = /^[A-Za-z0-9_-]{3,128}$/;

function digest(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * In-memory session registry for server-side use only.
 *
 * IMPORTANT: create() must only be called after a trusted authentication step.
 * A subjectId supplied by an unauthenticated client is not proof of identity.
 * Tokens are opaque bearer credentials; never log or persist their raw values.
 * The registry is process-local and all sessions are invalidated on restart.
 */
export class SessionRegistry {
  #sessions = new Map();

  constructor({ now = () => Date.now(), defaultTtlMs = DEFAULT_TTL_MS } = {}) {
    if (typeof now !== "function") throw new TypeError("now must be a function");
    if (!Number.isSafeInteger(defaultTtlMs) || defaultTtlMs < 1 || defaultTtlMs > MAX_TTL_MS) {
      throw new RangeError("defaultTtlMs is outside the allowed range");
    }
    this.now = now;
    this.defaultTtlMs = defaultTtlMs;
  }

  create(subjectId, { ttlMs = this.defaultTtlMs } = {}) {
    if (typeof subjectId !== "string" || !SUBJECT_ID_PATTERN.test(subjectId)) {
      throw new TypeError("subjectId must be a validated server-owned identifier");
    }
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_TTL_MS) {
      throw new RangeError("ttlMs is outside the allowed range");
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = digest(token);
    const createdAt = this.now();
    const session = Object.freeze({
      subjectId,
      createdAt,
      expiresAt: createdAt + ttlMs
    });
    this.#sessions.set(tokenHash, session);
    return Object.freeze({ token, subjectId, createdAt, expiresAt: session.expiresAt });
  }

  verify(token) {
    if (typeof token !== "string" || token.length < 40 || token.length > 128) return null;
    const tokenHash = digest(token);
    const session = this.#sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt <= this.now()) {
      this.#sessions.delete(tokenHash);
      return null;
    }
    return Object.freeze({
      subjectId: session.subjectId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    });
  }

  revoke(token) {
    if (typeof token !== "string" || token.length < 40 || token.length > 128) return false;
    return this.#sessions.delete(digest(token));
  }

  pruneExpired() {
    const now = this.now();
    let removed = 0;
    for (const [tokenHash, session] of this.#sessions) {
      if (session.expiresAt <= now) {
        this.#sessions.delete(tokenHash);
        removed += 1;
      }
    }
    return removed;
  }

  get size() {
    return this.#sessions.size;
  }
}
