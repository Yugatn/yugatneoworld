import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

// Minimal localStorage polyfill for Node tests
const store = new Map();
globalThis.localStorage = {
  getItem(k) { return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
  clear() { store.clear(); }
};
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const {
  createSubjectId,
  sanitizeDisplayName,
  createAccount,
  registerAccount,
  signIn,
  signOut,
  getSession,
  listAccounts,
  updateSessionProfile,
  deleteAccount,
  getAccount
} = await import("../src/domain/identity.js");

store.clear();

assert.equal(sanitizeDisplayName("  Alice  "), "Alice");
assert.equal(sanitizeDisplayName(""), "Guest");
assert.ok(createSubjectId().startsWith("u_"));

const guest = getSession();
assert.equal(guest.mode, "guest");
assert.equal(guest.displayName, "Guest");

const session = registerAccount("Югатн", "casual");
assert.equal(session.mode, "account");
assert.equal(session.displayName, "Югатн");
assert.ok(session.subjectId.startsWith("u_"));
assert.equal(listAccounts().length, 1);

const again = getSession();
assert.equal(again.subjectId, session.subjectId);
assert.equal(again.displayName, "Югатн");

updateSessionProfile({ displayName: "Yugatn" });
assert.equal(getSession().displayName, "Yugatn");
assert.equal(getAccount(session.subjectId).displayName, "Yugatn");

const second = registerAccount("Friend");
assert.equal(listAccounts().length, 2);

signOut();
assert.equal(getSession().mode, "guest");
assert.equal(listAccounts().length, 2);

const back = signIn(session.subjectId);
assert.equal(back.displayName, "Yugatn");
assert.equal(getSession().mode, "account");

deleteAccount(second.subjectId);
assert.equal(listAccounts().length, 1);
assert.equal(signIn(second.subjectId), null);

console.log("identity tests OK");
