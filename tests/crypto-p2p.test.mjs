import assert from "node:assert/strict";
import {
  createCryptoP2PState,
  createOffer,
  cancelOffer,
  searchOffers,
  takeOffer,
  markCryptoSent,
  completeDeal,
  listExchangers,
  estimateYc,
  createCryptoPayIntent,
  submitCryptoTx,
  confirmCryptoPayIntent,
  summarizeCryptoP2P,
  CRYPTO_ASSETS,
  P2P_EXCHANGERS
} from "../src/domain/crypto-p2p.js";
import {
  createCurrencyState,
  ensureWallet,
  getBalance,
  credit
} from "../src/domain/currency.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 20);
const world = createDefaultWorld();
assert.ok(world.cryptoP2p);
assert.ok(CRYPTO_ASSETS.length >= 3);
assert.ok(P2P_EXCHANGERS.length >= 2);
assert.ok(listExchangers({ asset: "USDT" }).length >= 1);

const est = estimateYc("USDT", 10);
assert.equal(est.ok, true);
assert.equal(est.yc, 10);

const cur = createCurrencyState();
const p2p = createCryptoP2PState();
ensureWallet(cur, "maker", { initial: 200 });
ensureWallet(cur, "taker", { initial: 20 });

const offer = createOffer(p2p, cur, {
  makerId: "maker",
  side: "sell_yc",
  asset: "USDT",
  ycAmount: 50,
  exchangerId: "local_desk"
});
assert.equal(offer.ok, true);
assert.ok(getBalance(cur, "maker") < 200);
assert.equal(searchOffers(p2p, { asset: "USDT" }).length, 1);

const taken = takeOffer(p2p, offer.offer.id, "taker");
assert.equal(taken.ok, true);
assert.equal(taken.deal.status, "pending_crypto");

markCryptoSent(p2p, taken.deal.id, "taker", { txHint: "demo-tx-1" });
const done = completeDeal(p2p, cur, taken.deal.id, "maker");
assert.equal(done.ok, true);
assert.ok(getBalance(cur, "taker") >= 70);

const offer2 = createOffer(p2p, cur, {
  makerId: "maker",
  side: "sell_yc",
  asset: "TON",
  ycAmount: 10,
  exchangerId: "community_otc"
});
assert.equal(cancelOffer(p2p, cur, offer2.offer.id, "maker").ok, true);

const intent = createCryptoPayIntent(p2p, {
  userId: "buyer",
  asset: "USDT",
  ycAmount: 25,
  refType: "marketplace",
  refId: "lst_demo"
});
assert.equal(intent.ok, true);
assert.ok(intent.intent.memo.startsWith("EW-"));
submitCryptoTx(p2p, intent.intent.id, "buyer", { txHint: "0xdemo" });
const conf = confirmCryptoPayIntent(p2p, cur, intent.intent.id);
assert.equal(conf.ok, true);
assert.ok(getBalance(cur, "buyer") >= 25);

assert.ok(summarizeCryptoP2P(p2p).includes("open"));
assert.equal(matchVoiceCommand("крипта").id, "crypto.p2p");
assert.equal(matchVoiceCommand("p2p обмен").id, "crypto.p2p");
assert.equal(matchVoiceCommand("оплата usdt").id, "crypto.pay");

console.log("crypto-p2p tests OK");
