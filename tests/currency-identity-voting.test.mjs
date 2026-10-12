import assert from "node:assert/strict";
import {
  createCurrencyState,
  ensureWallet,
  getBalance,
  credit,
  debit,
  transfer,
  CURRENCY_CODE,
  summarizeCurrency
} from "../src/domain/currency.js";
import {
  createIdentityState,
  verifyPhone,
  linkPassportAndInn,
  getVerification,
  isFullyVerified,
  revokeVerification,
  hashIdentityValue
} from "../src/domain/identity-verify.js";
import {
  createVotingState,
  createPoll,
  castVote,
  closePoll,
  getPollResults,
  listPolls
} from "../src/domain/voting.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 16);
const world = createDefaultWorld();
assert.ok(world.currency);
assert.ok(world.identity);
assert.ok(world.voting);

// —— Currency ——
const cur = createCurrencyState();
ensureWallet(cur, "u1");
assert.ok(getBalance(cur, "u1") >= 0);
credit(cur, "u1", 50, { type: "reward", note: "test" });
assert.equal(debit(cur, "u1", 10, { type: "purchase" }).ok, true);
assert.equal(transfer(cur, "u1", "u2", 5).ok, true);
assert.ok(getBalance(cur, "u2") >= 5);
assert.ok(summarizeCurrency(cur, "u1").includes(CURRENCY_CODE));

// —— Identity ——
const id = createIdentityState();
assert.equal(isFullyVerified(id, "u1"), false);
assert.equal(verifyPhone(id, "u1", "+79001234567", { consent: false }).ok, false);
const phone = verifyPhone(id, "u1", "+7 (900) 123-45-67", {
  consent: true,
  smsCode: "1234",
  expectedCode: "1234"
});
assert.equal(phone.ok, true);
assert.equal(getVerification(id, "u1").levelName, "phone");

assert.equal(
  linkPassportAndInn(id, "u1", { passport: "1234 567890", inn: "123456789012", consent: false }).ok,
  false
);
const full = linkPassportAndInn(id, "u1", {
  passport: "1234 567890",
  inn: "123456789012",
  consent: true
});
assert.equal(full.ok, true);
assert.equal(isFullyVerified(id, "u1"), true);
assert.ok(getVerification(id, "u1").phoneMasked.endsWith("4567"));
// no plaintext in profile
assert.equal(id.profiles.u1.innHash, hashIdentityValue("123456789012"));
assert.ok(!JSON.stringify(id.profiles.u1).includes("123456789012"));

// duplicate INN blocked
verifyPhone(id, "u2", "79007654321", { consent: true });
assert.equal(
  linkPassportAndInn(id, "u2", {
    passport: "9999 888877",
    inn: "123456789012",
    consent: true
  }).reason,
  "inn_already_used"
);

// —— Voting ——
const vot = createVotingState();
const community = createPoll(vot, {
  title: "Выбрать цвет улицы",
  options: ["Синий", "Зелёный"],
  type: "community",
  createdBy: "u1"
});
assert.equal(community.ok, true);
assert.equal(castVote(vot, id, { pollId: community.poll.id, userId: "guest", optionId: community.poll.options[0].id }).ok, true);

const official = createPoll(vot, {
  title: "Официальный опрос района",
  options: ["За", "Против"],
  type: "official",
  createdBy: "u1"
});
assert.equal(official.ok, true);
assert.equal(official.poll.requireFullVerification, true);
assert.equal(
  castVote(vot, id, {
    pollId: official.poll.id,
    userId: "guest",
    optionId: official.poll.options[0].id
  }).reason,
  "verification_required"
);
assert.equal(
  castVote(vot, id, {
    pollId: official.poll.id,
    userId: "u1",
    optionId: official.poll.options[0].id
  }).ok,
  true
);
const results = getPollResults(vot, official.poll.id);
assert.equal(results.totalVotes, 1);
closePoll(vot, official.poll.id, "u1");
assert.ok(listPolls(vot, { status: "closed" }).length >= 1);

revokeVerification(id, "u1");
assert.equal(isFullyVerified(id, "u1"), false);

assert.equal(matchVoiceCommand("голосование").id, "voting.open");
assert.equal(matchVoiceCommand("верификация").id, "identity.verify");
assert.equal(matchVoiceCommand("баланс").id, "currency.balance");

console.log("currency-identity-voting tests OK");
