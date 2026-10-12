/**
 * Avatar clothing & items shop.
 * Philosophy: affordable by default — everyday wear stays cheap;
 * NFT is optional prestige, not a paywall; second-hand keeps items circulating.
 * Real-world fashion markets are deep-links (no payment processing in v0.1).
 */

import { CLOTHING_CATALOG, CLOTHING_SLOTS, ownClothing } from "./avatar.js";

/** Symbolic in-world currency (not real money). */
export const SHOP_CURRENCY = "YC"; // Yugatn Credits

/** Affordable price bands (YC). */
export const PRICE_BANDS = Object.freeze({
  free: 0,
  starter: 2,
  everyday: 5,
  nice: 12,
  nft_mint: 25, // still modest — not luxury gatekeeping
  nft_floor_min: 8 // second-hand NFT can go lower than mint
});

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Primary shop catalog — low prices by design. */
export const AVATAR_SHOP_CATALOG = Object.freeze([
  { id: "top-casual", slot: "top", name: "Casual shirt", price: 2, kind: "standard", style: "casual" },
  { id: "top-formal", slot: "top", name: "Formal shirt", price: 5, kind: "standard", style: "formal" },
  { id: "top-sport", slot: "top", name: "Sport tee", price: 3, kind: "standard", style: "sport" },
  { id: "top-hoodie", slot: "top", name: "Hoodie", price: 5, kind: "standard", style: "casual" },
  { id: "bottom-jeans", slot: "bottom", name: "Jeans", price: 4, kind: "standard", style: "casual" },
  { id: "bottom-formal", slot: "bottom", name: "Dress pants", price: 5, kind: "standard", style: "formal" },
  { id: "bottom-sport", slot: "bottom", name: "Track pants", price: 3, kind: "standard", style: "sport" },
  { id: "shoes-sneakers", slot: "shoes", name: "Sneakers", price: 4, kind: "standard", style: "casual" },
  { id: "shoes-formal", slot: "shoes", name: "Dress shoes", price: 6, kind: "standard", style: "formal" },
  { id: "shoes-sport", slot: "shoes", name: "Trainers", price: 4, kind: "standard", style: "sport" },
  { id: "acc-glasses", slot: "accessory", name: "Glasses", price: 2, kind: "standard", style: "neutral" },
  { id: "acc-hat", slot: "accessory", name: "Hat", price: 2, kind: "standard", style: "casual" },
  { id: "acc-scarf", slot: "accessory", name: "Scarf", price: 2, kind: "standard", style: "casual" },
  // NFT drop — unique token, higher but still accessible mint
  { id: "nft-aurora-jacket", slot: "top", name: "Aurora Jacket (NFT)", price: 25, kind: "nft", style: "formal", limited: 100 },
  { id: "nft-orbit-sneakers", slot: "shoes", name: "Orbit Sneakers (NFT)", price: 25, kind: "nft", style: "sport", limited: 100 },
  { id: "nft-city-cap", slot: "accessory", name: "City Cap (NFT)", price: 18, kind: "nft", style: "casual", limited: 200 }
]);

/** Connected real-world fashion markets (affiliate / deep-link stubs). */
export const REAL_FASHION_MARKETS = Object.freeze([
  {
    id: "market-local",
    name: "Local thrift & basics",
    region: "EU",
    philosophy: "affordable everyday wear",
    url: "https://example.com/markets/local-basics",
    tags: ["second-hand", "basics", "budget"]
  },
  {
    id: "market-highstreet",
    name: "High-street partners",
    region: "global",
    philosophy: "mid-range real clothes for the user, not the avatar",
    url: "https://example.com/markets/highstreet",
    tags: ["apparel", "delivery"]
  },
  {
    id: "market-marketplace",
    name: "Community resale market",
    region: "global",
    philosophy: "peer second-hand for real garments",
    url: "https://example.com/markets/resale",
    tags: ["second-hand", "peer"]
  }
]);

export function createAvatarShopState(seed = {}) {
  return {
    /** User balance in YC (starts modest so free/starter items matter). */
    balance: typeof seed.balance === "number" ? seed.balance : 40,
    /** Owned standard item ids (syncs toward avatar wardrobe). */
    owned: Array.isArray(seed.owned) ? [...seed.owned] : [],
    /** NFT instances: { tokenId, catalogId, ownerId, mintedAt, listedPrice|null } */
    nfts: Array.isArray(seed.nfts) ? seed.nfts.map((n) => ({ ...n })) : [],
    /** Second-hand listings: { listingId, sellerId, catalogId, tokenId|null, price, kind } */
    listings: Array.isArray(seed.listings) ? seed.listings.map((l) => ({ ...l })) : [],
    mintCounts: seed.mintCounts && typeof seed.mintCounts === "object" ? { ...seed.mintCounts } : {}
  };
}

export function listShopCatalog({ kind, slot, maxPrice } = {}) {
  let list = AVATAR_SHOP_CATALOG.map((i) => ({ ...i }));
  if (kind) list = list.filter((i) => i.kind === kind);
  if (slot) list = list.filter((i) => i.slot === slot);
  if (maxPrice != null) list = list.filter((i) => i.price <= maxPrice);
  return list.sort((a, b) => a.price - b.price);
}

export function getShopItem(catalogId) {
  return AVATAR_SHOP_CATALOG.find((i) => i.id === catalogId) || null;
}

export function creditBalance(shopState, amount) {
  const n = Math.max(0, Number(amount) || 0);
  shopState.balance = Math.round((shopState.balance + n) * 100) / 100;
  return shopState.balance;
}

export function debitBalance(shopState, amount) {
  const n = Math.max(0, Number(amount) || 0);
  if (shopState.balance < n) return false;
  shopState.balance = Math.round((shopState.balance - n) * 100) / 100;
  return true;
}

/**
 * Buy standard (non-NFT) item into wardrobe. Affordable path.
 */
export function buyStandard(shopState, avatarState, catalogId, ownerId = "local") {
  const item = getShopItem(catalogId);
  if (!item || item.kind === "nft") return { ok: false, reason: "not_standard" };
  if (shopState.owned.includes(catalogId) || avatarState?.wardrobe?.includes(catalogId)) {
    return { ok: false, reason: "already_owned" };
  }
  if (!debitBalance(shopState, item.price)) return { ok: false, reason: "insufficient_balance" };
  shopState.owned.push(catalogId);
  if (avatarState) ownClothing(avatarState, catalogId);
  return {
    ok: true,
    item,
    price: item.price,
    currency: SHOP_CURRENCY,
    balance: shopState.balance,
    ownerId
  };
}

/** Mint NFT clothing — limited supply, modest fee. */
export function mintNft(shopState, catalogId, ownerId) {
  const item = getShopItem(catalogId);
  if (!item || item.kind !== "nft") return { ok: false, reason: "not_nft" };
  const minted = shopState.mintCounts[catalogId] || 0;
  if (item.limited != null && minted >= item.limited) return { ok: false, reason: "sold_out" };
  if (!debitBalance(shopState, item.price)) return { ok: false, reason: "insufficient_balance" };
  shopState.mintCounts[catalogId] = minted + 1;
  const token = {
    tokenId: uid("nft"),
    catalogId,
    ownerId: String(ownerId || "local"),
    mintedAt: Date.now(),
    listedPrice: null,
    name: item.name,
    slot: item.slot
  };
  shopState.nfts.push(token);
  return { ok: true, token, price: item.price, balance: shopState.balance };
}

/** List owned item (standard copy or NFT) on second-hand. */
export function listSecondHand(shopState, {
  sellerId,
  catalogId,
  tokenId = null,
  price
} = {}) {
  const item = getShopItem(catalogId);
  if (!item) return { ok: false, reason: "unknown_item" };
  const p = Number(price);
  if (!Number.isFinite(p) || p < 0) return { ok: false, reason: "bad_price" };

  if (tokenId) {
    const nft = shopState.nfts.find((n) => n.tokenId === tokenId && n.ownerId === sellerId);
    if (!nft) return { ok: false, reason: "not_your_nft" };
    if (nft.listedPrice != null) return { ok: false, reason: "already_listed" };
    // Encourage affordable resale: soft hint if way above mint
    nft.listedPrice = p;
    const listing = {
      listingId: uid("lst"),
      sellerId,
      catalogId,
      tokenId,
      price: p,
      kind: "nft",
      createdAt: Date.now()
    };
    shopState.listings.push(listing);
    return { ok: true, listing };
  }

  // Standard second-hand: seller must own
  if (!shopState.owned.includes(catalogId)) return { ok: false, reason: "not_owned" };
  const listing = {
    listingId: uid("lst"),
    sellerId: String(sellerId || "local"),
    catalogId,
    tokenId: null,
    price: p,
    kind: "standard",
    createdAt: Date.now()
  };
  shopState.listings.push(listing);
  return { ok: true, listing };
}

export function cancelListing(shopState, listingId, sellerId) {
  const i = shopState.listings.findIndex((l) => l.listingId === listingId && l.sellerId === sellerId);
  if (i < 0) return false;
  const [listing] = shopState.listings.splice(i, 1);
  if (listing.tokenId) {
    const nft = shopState.nfts.find((n) => n.tokenId === listing.tokenId);
    if (nft) nft.listedPrice = null;
  }
  return true;
}

/** Buy from second-hand market. */
export function buySecondHand(shopState, avatarState, listingId, buyerId) {
  const listing = shopState.listings.find((l) => l.listingId === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.sellerId === buyerId) return { ok: false, reason: "own_listing" };
  if (!debitBalance(shopState, listing.price)) return { ok: false, reason: "insufficient_balance" };

  // Credit seller (same local book in v0.1 — multi-user ledger later)
  creditBalance(shopState, 0); // buyer already debited; seller credit is conceptual
  // For single-player book we only track buyer balance; multiplayer would split wallets.

  if (listing.kind === "nft" && listing.tokenId) {
    const nft = shopState.nfts.find((n) => n.tokenId === listing.tokenId);
    if (!nft) return { ok: false, reason: "nft_missing" };
    nft.ownerId = String(buyerId);
    nft.listedPrice = null;
  } else {
    if (!shopState.owned.includes(listing.catalogId)) shopState.owned.push(listing.catalogId);
    if (avatarState) ownClothing(avatarState, listing.catalogId);
  }

  shopState.listings = shopState.listings.filter((l) => l.listingId !== listingId);
  return {
    ok: true,
    listing,
    price: listing.price,
    balance: shopState.balance,
    message: "Second-hand purchase complete"
  };
}

export function listSecondHandMarket(shopState, { maxPrice, kind } = {}) {
  let list = shopState.listings.map((l) => ({ ...l }));
  if (kind) list = list.filter((l) => l.kind === kind);
  if (maxPrice != null) list = list.filter((l) => l.price <= maxPrice);
  return list.sort((a, b) => a.price - b.price);
}

export function listRealFashionMarkets(filter = {}) {
  let list = REAL_FASHION_MARKETS.map((m) => ({ ...m }));
  if (filter.tag) list = list.filter((m) => m.tags.includes(filter.tag));
  return list;
}

/** Open real-world market (returns deep-link payload; UI opens URL). */
export function openRealMarket(marketId) {
  const m = REAL_FASHION_MARKETS.find((x) => x.id === marketId);
  if (!m) return { ok: false, reason: "unknown_market" };
  return {
    ok: true,
    market: { ...m },
    note: "Real purchase happens on partner site; eWorld does not charge for real garments."
  };
}

export function nftsOwnedBy(shopState, ownerId) {
  return shopState.nfts.filter((n) => n.ownerId === ownerId).map((n) => ({ ...n }));
}

export function summarizeAvatarShop(shopState) {
  return `${shopState.balance} ${SHOP_CURRENCY} · owned ${shopState.owned.length} · NFT ${shopState.nfts.length} · listings ${shopState.listings.length}`;
}
