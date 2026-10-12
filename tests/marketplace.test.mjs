import assert from "node:assert/strict";
import {
  createMarketplaceState,
  createListing,
  searchListings,
  purchaseListing,
  withdrawListing,
  reserveListing,
  markSoldMeet,
  seedDemoListings,
  CATEGORIES,
  summarizeMarketplace
} from "../src/domain/marketplace.js";
import { createPaymentsState } from "../src/domain/payments.js";
import {
  createCurrencyState,
  ensureWallet,
  getBalance
} from "../src/domain/currency.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 19);
const world = createDefaultWorld();
assert.ok(world.marketplace);
assert.ok(world.payments);
assert.ok(world.marketplace.listings.length >= 1);
assert.ok(CATEGORIES.length >= 5);

const mp = createMarketplaceState();
const cur = createCurrencyState();
const pay = createPaymentsState();
ensureWallet(cur, "seller", { initial: 50 });
ensureWallet(cur, "buyer", { initial: 80 });

const created = createListing(mp, {
  sellerId: "seller",
  title: "Стол письменный",
  description: "Деревянный, б/у",
  category: "home",
  condition: "used",
  priceYc: 20,
  city: "Москва",
  settlement: "yc"
});
assert.equal(created.ok, true);
assert.equal(created.listing.status, "active");

const found = searchListings(mp, { query: "стол", category: "home" });
assert.ok(found.length >= 1);

assert.equal(
  purchaseListing(mp, cur, pay, { listingId: created.listing.id, buyerId: "seller" }).reason,
  "own_listing"
);

const buy = purchaseListing(mp, cur, pay, {
  listingId: created.listing.id,
  buyerId: "buyer",
  escrow: false
});
assert.equal(buy.ok, true);
assert.equal(buy.listing.status, "sold");
assert.ok(getBalance(cur, "buyer") < 80);
assert.ok(getBalance(cur, "seller") > 50);

const meet = createListing(mp, {
  sellerId: "seller",
  title: "Диван",
  priceYc: 100,
  settlement: "meet",
  category: "home"
});
assert.equal(
  purchaseListing(mp, cur, pay, { listingId: meet.listing.id, buyerId: "buyer" }).reason,
  "meet_only"
);
reserveListing(mp, meet.listing.id, "buyer");
assert.equal(markSoldMeet(mp, meet.listing.id, "seller", "buyer").ok, true);

const w = createListing(mp, {
  sellerId: "seller",
  title: "Лишнее",
  priceYc: 1
});
assert.equal(withdrawListing(mp, w.listing.id, "seller").ok, true);

const demo = createMarketplaceState();
seedDemoListings(demo);
assert.ok(searchListings(demo, {}).length >= 2);
assert.ok(summarizeMarketplace(demo).includes("active"));

assert.equal(matchVoiceCommand("маркетплейс").id, "marketplace.open");
assert.equal(matchVoiceCommand("продать товар").id, "marketplace.sell");
assert.equal(matchVoiceCommand("авито").id, "marketplace.open");

console.log("marketplace tests OK");
