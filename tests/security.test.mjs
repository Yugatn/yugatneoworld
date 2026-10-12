import assert from "node:assert/strict";
import {
  createSecurityState,
  audit,
  listAudit,
  checkRateLimit,
  rateLimitAction,
  createSession,
  touchSession,
  revokeSession,
  revokeAllSessions,
  redactObject,
  sanitizeText,
  secureExportWorldSlice,
  classifyField,
  authorizeSensitiveAction,
  SECURITY_HEADERS,
  DATA_CLASS,
  PRODUCTION_CHECKLIST,
  RATE_LIMITS,
  summarizeSecurity
} from "../src/domain/security.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 17);
const world = createDefaultWorld();
assert.ok(world.security);
assert.ok(SECURITY_HEADERS["Content-Security-Policy"].includes("default-src"));
assert.ok(PRODUCTION_CHECKLIST.length >= 8);

const sec = createSecurityState();

// Audit + redaction
audit(sec, "identity.verify", {
  userId: "u1",
  detail: { passport: "1234567890", inn: "123456789012", ok: true }
});
const logs = listAudit(sec, { userId: "u1" });
assert.ok(logs.length >= 1);
assert.equal(logs[0].detail.passport, "[REDACTED]");

const red = redactObject({ phoneHash: "abc", name: "Ada", nested: { token: "xyz" } });
assert.equal(red.phoneHash, "[REDACTED]");
assert.equal(red.name, "Ada");
assert.equal(red.nested.token, "[REDACTED]");

assert.ok(!sanitizeText("<script>alert(1)</script>hi").includes("script"));
assert.ok(sanitizeText("a".repeat(5000)).length <= 2000);

// Rate limit
const lim = { windowMs: 60_000, max: 3 };
assert.equal(checkRateLimit(sec, "t:u", lim).ok, true);
assert.equal(checkRateLimit(sec, "t:u", lim).ok, true);
assert.equal(checkRateLimit(sec, "t:u", lim).ok, true);
assert.equal(checkRateLimit(sec, "t:u", lim).ok, false);

// Sessions
const ses = createSession(sec, "u1", { roles: ["user"] });
assert.equal(ses.ok, true);
assert.equal(touchSession(sec, ses.sessionId).ok, true);
assert.equal(touchSession(sec, ses.sessionId).userId, "u1");
revokeSession(sec, ses.sessionId);
assert.equal(touchSession(sec, ses.sessionId).ok, false);

const s2 = createSession(sec, "u2");
revokeAllSessions(sec, "u2");
assert.equal(touchSession(sec, s2.sessionId).ok, false);

// Export without restricted hashes
const slice = secureExportWorldSlice(
  {
    version: 17,
    avatar: { x: 1, y: 2, appearance: {} },
    identity: {
      profiles: {
        u1: {
          userId: "u1",
          level: 2,
          phoneMasked: "***4567",
          innHash: "should-not-export",
          passportHash: "nope"
        }
      }
    }
  },
  sec
);
assert.ok(slice.fingerprint);
assert.equal(slice.identity.profiles.u1.innHash, undefined);
assert.equal(slice.identity.profiles.u1.fullyVerified, true);

assert.equal(classifyField("identity.innHash"), DATA_CLASS.RESTRICTED);
assert.equal(classifyField("health.vitals"), DATA_CLASS.CONFIDENTIAL);

const auth = authorizeSensitiveAction(sec, {
  userId: "u3",
  action: "vote"
});
assert.equal(auth.ok, true);

assert.ok(summarizeSecurity(sec).includes("audit"));
assert.ok(RATE_LIMITS.verifyPhone.max <= 10);

assert.equal(matchVoiceCommand("безопасность").id, "security.status");

console.log("security tests OK");
