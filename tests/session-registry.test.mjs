import assert from "node:assert/strict";
import { SessionRegistry } from "../server/session-registry.js";

let now = 1_800_000_000_000;
const sessions = new SessionRegistry({ now: () => now, defaultTtlMs: 1_000 });

const created = sessions.create("subject_123");
assert.equal(typeof created.token, "string");
assert.ok(created.token.length >= 40, "session token should have high entropy");
assert.equal(sessions.size, 1);

const verified = sessions.verify(created.token);
assert.deepEqual(verified, {
  subjectId: "subject_123",
  createdAt: now,
  expiresAt: now + 1_000
});
assert.equal(Object.hasOwn(verified, "token"), false, "verification must not return the bearer token");
assert.equal(sessions.verify("not-a-session-token"), null);

const second = sessions.create("subject_456", { ttlMs: 2_000 });
assert.notEqual(second.token, created.token);
assert.equal(sessions.verify(second.token).subjectId, "subject_456");

assert.equal(sessions.revoke(created.token), true);
assert.equal(sessions.verify(created.token), null);
assert.equal(sessions.revoke(created.token), false, "revocation should be idempotent for unknown tokens");

now += 2_000;
assert.equal(sessions.verify(second.token), null, "expired sessions must fail verification");
assert.equal(sessions.pruneExpired(), 0, "verify removes the expired session");
assert.equal(sessions.size, 0);

assert.throws(() => sessions.create(""), /subjectId/);
assert.throws(() => sessions.create("subject_123", { ttlMs: 0 }), /ttlMs/);
assert.throws(() => sessions.create("subject_123", { ttlMs: 24 * 60 * 60 * 1000 + 1 }), /ttlMs/);

const third = sessions.create("subject_789", { ttlMs: 10 });
now += 10;
assert.equal(sessions.pruneExpired(), 1);
assert.equal(sessions.verify(third.token), null);

console.log("session-registry OK");
