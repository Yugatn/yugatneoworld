import assert from "node:assert/strict";
import {
  createPaymentsState,
  createPayment,
  releaseEscrow,
  refundEscrow,
  listOrders,
  summarizePayments
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

// Instant payment
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
assert.ok(getBalance(cur, "buyer") < 100);

// Escrow flow
credit(cur, "buyer", 50);
const esc = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 20,
  method: "yc_escrow",
  platformFeeRate: 0.02
});
assert.equal(esc.ok, true);
assert.equal(esc.order.status, "held");
const beforeSeller = getBalance(cur, "seller");
const rel = releaseEscrow(pay, cur, esc.order.id, { actorId: "buyer" });
assert.equal(rel.ok, true);
assert.equal(rel.order.status, "completed");
assert.ok(getBalance(cur, "seller") > beforeSeller);

// Refund escrow
credit(cur, "buyer", 30);
const esc2 = createPayment(pay, cur, {
  buyerId: "buyer",
  sellerId: "seller",
  amount: 12,
  method: "yc_escrow"
});
const ref = refundEscrow(pay, cur, esc2.order.id, { actorId: "seller", reason: "no stock" });
assert.equal(ref.ok, true);
assert.equal(ref.order.status, "refunded");

assert.ok(listOrders(pay, "buyer").length >= 1);
assert.ok(summarizePayments(pay).includes("completed"));

// Marketplace + payments
const mp = createMarketplaceState();
const listing = createListing(mp, {
  sellerId: "seller",
  title: "Монитор 24",
  priceYc: 25,
  category: "electronics",
  settlement: "yc",
  preferEscrow: true
});
assert.equal(listing.ok, true);

const buy = purchaseListing(mp, cur, pay, {
  listingId: listing.listing.id,
  buyerId: "buyer",
  escrow: true
});
assert.equal(buy.ok, true);
assert.equal(buy.method, "yc_escrow");
assert.equal(buy.listing.status, "reserved");

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
const can = cancelPurchase(mp, cur, pay, {
  listingId: l2.listing.id,
  actorId: "buyer",
  reason: "changed mind"
});
assert.equal(can.ok, true);
assert.equal(can.listing.status, "active");

const instList = createListing(mp, {
  sellerId: "seller",
  title: "Мышь",
  priceYc: 5
});
const buy3 = purchaseListing(mp, cur, pay, {
  listingId: instList.listing.id,
  buyerId: "buyer",
  escrow: false
});
assert.equal(buy3.ok, true);
assert.equal(buy3.listing.status, "sold");

assert.ok(searchListings(mp, { status: "sold" }).length >= 1);
assert.equal(matchVoiceCommand("оплата").id, "payments.orders");
assert.equal(matchVoiceCommand("эскроу").id, "payments.escrow");

console.log("payments-marketplace tests OK");
