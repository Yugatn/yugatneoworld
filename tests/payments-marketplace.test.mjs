import assert from "node:assert/strict";
import {
  createPaymentsState,
  createPayment,
  releaseEscrow,
  refundEscrow,
  listOrders,
  listReceipts,
  rateSeller,
  getSellerRating,
  autoReleaseExpired,
  summarizePayments,
  DEFAULT_ESCROW_TTL_MS
} from "../src/domain/payments.js";
import {
  createMarketplaceState,
  createListing,
  purchaseListing,
  confirmPurchase,
  cancelPurchase,
  searchListings
} from "../src/domain/marketplace.js";
import {
  createCurrencyState,
  ensureWallet,
  getBalance,
  credit
} from "../src/domain/currency.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 19);
const world = createDefaultWorld();
assert.ok(world.payments);
assert.ok(world.marketplace);

const cur = createCurrencyState();
const pay = createPaymentsState();
ensureWallet(cur, "buyer", { initial: 100 });
ensureWallet(cur, "seller", { initial: 10 });

const inst = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 15,
  method: "yc_instant",
  refType: "test",
  platformFeeRate: 0.02
});
assert.equal(inst.ok, true);
assert.equal(inst.order.status, "completed");
assert.ok(inst.receipt);
assert.ok(listReceipts(pay, "buyer").length >= 1);

credit(cur, "buyer", 50);
const esc = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 20,
  method: "yc_escrow",
  platformFeeRate: 0.02,
  escrowTtlMs: 1000
});
assert.equal(esc.ok, true);
assert.equal(esc.order.status, "held");
assert.ok(esc.order.releaseAfter > Date.now());

const beforeSeller = getBalance(cur, "seller");
const rel = releaseEscrow(pay, cur, esc.order.id, { actorId: "buyer" });
assert.equal(rel.ok, true);
assert.ok(getBalance(cur, "seller") > beforeSeller);

const rate = rateSeller(pay, esc.order.id, "buyer", 5, { comment: "ок" });
assert.equal(rate.ok, true);
assert.equal(getSellerRating(pay, "seller").count, 1);
assert.equal(getSellerRating(pay, "seller").avg, 5);
assert.equal(rateSeller(pay, esc.order.id, "buyer", 4).reason, "already_rated");

credit(cur, "buyer", 30);
const esc2 = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 12,
  method: "yc_escrow",
  escrowTtlMs: 60_000
});
const held = pay.orders.find((o) => o.id === esc2.order.id);
assert.ok(held);
held.releaseAfter = Date.now() - 1;
const auto = autoReleaseExpired(pay, cur);
assert.ok(auto.released.includes(esc2.order.id));

credit(cur, "buyer", 20);
const esc3 = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 8,
  method: "yc_escrow"
});
const ref = refundEscrow(pay, cur, esc3.order.id, { actorId: "seller", reason: "no stock" });
assert.equal(ref.ok, true);

assert.ok(listOrders(pay, "buyer").length >= 1);
assert.ok(summarizePayments(pay).includes("receipts"));
assert.ok(DEFAULT_ESCROW_TTL_MS > 0);

const mp = createMarketplaceState();
const listing = createListing(mp, {
  sellerId: "seller",
  title: "Монитор 24",
  priceYc: 25,
  category: "electronics",
  settlement: "yc",
  preferEscrow: true
});
const buy = purchaseListing(mp, cur, pay, {
  listingId: listing.listing.id,
  buyerId: "buyer",
  escrow: true
});
assert.equal(buy.ok, true);
assert.equal(buy.method, "yc_escrow");
const conf = confirmPurchase(mp, cur, pay, {
  listingId: listing.listing.id,
  buyerId: "buyer"
});
assert.equal(conf.ok, true);
assert.equal(conf.listing.status, "sold");

const l2 = createListing(mp, {
  sellerId: "seller",
  title: "Клавиатура",
  priceYc: 10,
  settlement: "yc"
});
const buy2 = purchaseListing(mp, cur, pay, {
  listingId: l2.listing.id,
  buyerId: "buyer",
  escrow: true
});
assert.equal(buy2.ok, true);
assert.equal(
  cancelPurchase(mp, cur, pay, {
    listingId: l2.listing.id,
    actorId: "buyer",
    reason: "changed mind"
  }).ok,
  true
);

const instList = createListing(mp, {
  sellerId: "seller",
  title: "Мышь",
  priceYc: 5
});
assert.equal(
  purchaseListing(mp, cur, pay, {
    listingId: instList.listing.id,
    buyerId: "buyer",
    escrow: false
  }).listing.status,
  "sold"
);

assert.ok(searchListings(mp, { status: "sold" }).length >= 1);
assert.equal(matchVoiceCommand("оплата").id, "payments.orders");
assert.equal(matchVoiceCommand("эскроу").id, "payments.escrow");
assert.equal(matchVoiceCommand("подтвердить получение").id, "payments.confirm");

console.log("payments-marketplace tests OK");
