import assert from "node:assert/strict";
import {
  createAvatarShopState,
  listShopCatalog,
  buyStandard,
  mintNft,
  listSecondHand,
  buySecondHand,
  listSecondHandMarket,
  listRealFashionMarkets,
  openRealMarket,
  creditBalance,
  PRICE_BANDS,
  summarizeAvatarShop
} from "../src/domain/avatar-shop.js";
import { createAvatarState } from "../src/domain/avatar.js";
import {
  createTravelState,
  searchTickets,
  draftTicket,
  confirmTicket,
  listTickets,
  summarizeTravel
} from "../src/domain/travel-tickets.js";
import {
  createCinemaState,
  purchaseScreening,
  inviteFriendsToWatch,
  respondToCinemaInvite,
  listCinemaInvites,
  endScreening
} from "../src/domain/cinema.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 12);
const world = createDefaultWorld();
assert.ok(world.avatarShop);
assert.ok(world.travel);
assert.ok(world.cinema);
assert.ok(world.objects.some((o) => o.id === "closet-shop"));
assert.ok(PRICE_BANDS.everyday <= 5);
assert.ok(PRICE_BANDS.nft_mint <= 30);

// —— Affordable shop ——
const shop = createAvatarShopState({ balance: 40 });
const avatar = createAvatarState();
const catalog = listShopCatalog({ kind: "standard" });
assert.ok(catalog.every((i) => i.price <= 12));
const cheap = listShopCatalog({ maxPrice: 3 });
assert.ok(cheap.length >= 1);

const buy = buyStandard(shop, avatar, "top-sport");
assert.equal(buy.ok, true);
assert.ok(avatar.wardrobe.includes("top-sport"));
assert.ok(shop.balance < 40);

// NFT mint
const mint = mintNft(shop, "nft-city-cap", "user1");
assert.equal(mint.ok, true);
assert.equal(mint.token.ownerId, "user1");

// Second-hand
const list = listSecondHand(shop, {
  sellerId: "user1",
  catalogId: "nft-city-cap",
  tokenId: mint.token.tokenId,
  price: 10
});
assert.equal(list.ok, true);
assert.ok(listSecondHandMarket(shop).length >= 1);

creditBalance(shop, 50);
const shBuy = buySecondHand(shop, avatar, list.listing.listingId, "user2");
assert.equal(shBuy.ok, true);

const markets = listRealFashionMarkets({ tag: "second-hand" });
assert.ok(markets.length >= 1);
const open = openRealMarket("market-local");
assert.equal(open.ok, true);
assert.ok(open.market.url);
assert.ok(summarizeAvatarShop(shop).includes("YC"));

// —— Travel ——
const travel = createTravelState();
const air = searchTickets({ mode: "air", from: "LED" });
assert.ok(air.length >= 1);
const rail = searchTickets({ mode: "rail", maxPrice: 40 });
assert.ok(rail.every((r) => r.basePrice <= 40));
const draft = draftTicket({
  routeId: "rail-led-mov",
  departAt: Date.now() + 86400_000,
  passengers: ["Anna", "Ivan"]
});
assert.ok(draft);
assert.equal(draft.mode, "rail");
assert.ok(draft.price < 100);
const conf = confirmTicket(travel, draft);
assert.equal(conf.ok, true);
assert.ok(listTickets(travel, { status: "confirmed" }).length >= 1);
assert.ok(summarizeTravel(travel).includes("rail"));

const airDraft = draftTicket({ routeId: "air-led-mov", passengers: ["Anna"] });
assert.equal(airDraft.mode, "air");
confirmTicket(travel, airDraft);

// —— Cinema invite friends ——
const cinema = createCinemaState();
const purch = purchaseScreening(cinema, "host1", { filmId: "classic-orbit", creditsAvailable: 20 });
assert.equal(purch.ok, true);
assert.equal(cinema.active, true);
assert.equal(cinema.purchasedBy, "host1");

const inv = inviteFriendsToWatch(cinema, "host1", ["friendA", "friendB"]);
assert.equal(inv.ok, true);
assert.equal(inv.added.length, 2);
assert.equal(listCinemaInvites(cinema, { status: "invited" }).length, 2);

const acc = respondToCinemaInvite(cinema, "friendA", true);
assert.equal(acc.ok, true);
assert.ok(cinema.viewers.includes("friendA"));

const dec = respondToCinemaInvite(cinema, "friendB", false);
assert.equal(dec.ok, true);
assert.ok(!cinema.viewers.includes("friendB"));

endScreening(cinema);
assert.equal(cinema.active, false);

assert.equal(matchVoiceCommand("магазин одежды").id, "avatar.shop");
assert.equal(matchVoiceCommand("second hand").id, "avatar.secondhand");
assert.equal(matchVoiceCommand("билеты на поезд").id, "travel.rail");
assert.equal(matchVoiceCommand("авиабилеты").id, "travel.air");
assert.equal(matchVoiceCommand("пригласить в кино").id, "cinema.invite");

console.log("shop-travel-cinema tests OK");
