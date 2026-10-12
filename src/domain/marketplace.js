/**
 * Peer-to-peer marketplace (Avito-style classifieds).
 * Users list goods; buyers pay in YC or mark "meet / arrange" without auto-pay.
 * Affordable defaults; not a fiat exchange.
 */

import { transfer, ensureWallet, getBalance, debit } from "./currency.js";
import { sanitizeText } from "./security.js";

export const LISTING_STATUSES = Object.freeze(["active", "reserved", "sold", "withdrawn"]);

export const CATEGORIES = Object.freeze([
  { id: "electronics", name: "Электроника", nameEn: "Electronics" },
  { id: "clothing", name: "Одежда и обувь", nameEn: "Clothing" },
  { id: "home", name: "Для дома", nameEn: "Home" },
  { id: "kids", name: "Детские товары", nameEn: "Kids" },
  { id: "hobby", name: "Хобби и спорт", nameEn: "Hobby" },
  { id: "transport", name: "Транспорт", nameEn: "Transport" },
  { id: "services", name: "Услуги", nameEn: "Services" },
  { id: "other", name: "Другое", nameEn: "Other" }
]);

export const CONDITIONS = Object.freeze(["new", "like_new", "used", "for_parts"]);

/** Soft fee on completed YC deals (taken from seller after transfer). */
export const PLATFORM_FEE_RATE = 0.02;
export const MAX_ACTIVE_PER_SELLER = 30;
export const MAX_PRICE_YC = 50_000;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function categoryOk(id) {
  return CATEGORIES.some((c) => c.id === id);
}

export function createMarketplaceState(seed = {}) {
  return {
    listings: Array.isArray(seed.listings) ? seed.listings.map((l) => ({ ...l })) : [],
    seeded: Boolean(seed.seeded)
  };
}

export function seedDemoListings(state, { sellerId = "demo_seller" } = {}) {
  if (state.seeded || state.listings.length > 0) return state;
  const samples = [
    {
      title: "Велосипед городской",
      description: "Исправный, крылья и багажник. Самовывоз.",
      category: "transport",
      condition: "used",
      priceYc: 45,
      city: "Город"
    },
    {
      title: "Книги по JS, пачка",
      description: "5 книг, почти новые.",
      category: "hobby",
      condition: "like_new",
      priceYc: 8,
      city: "Город"
    },
    {
      title: "Настольная лампа",
      description: "Тёплый свет, работает.",
      category: "home",
      condition: "used",
      priceYc: 6,
      city: "Город"
    }
  ];
  for (const s of samples) {
    createListing(state, { ...s, sellerId, settlement: "yc" });
  }
  state.seeded = true;
  return state;
}

export function createListing(state, {
  sellerId,
  title,
  description = "",
  category = "other",
  condition = "used",
  priceYc = 1,
  city = "",
  settlement = "yc",
  photos = []
} = {}) {
  const sid = String(sellerId || "local");
  const activeCount = state.listings.filter(
    (l) => l.sellerId === sid && l.status === "active"
  ).length;
  if (activeCount >= MAX_ACTIVE_PER_SELLER) {
    return { ok: false, reason: "too_many_active" };
  }

  const t = sanitizeText(title, { maxLen: 80 }).trim();
  if (t.length < 3) return { ok: false, reason: "title_too_short" };

  const cat = categoryOk(category) ? category : "other";
  const cond = CONDITIONS.includes(condition) ? condition : "used";
  let price = Math.round(Number(priceYc) * 100) / 100;
  if (!Number.isFinite(price) || price < 0) return { ok: false, reason: "bad_price" };
  if (price > MAX_PRICE_YC) return { ok: false, reason: "price_too_high" };

  const settle = ["yc", "meet", "either"].includes(settlement) ? settlement : "yc";

  const listing = {
    id: uid("lst"),
    sellerId: sid,
    title: t,
    description: sanitizeText(description, { maxLen: 1200 }),
    category: cat,
    condition: cond,
    priceYc: price,
    city: sanitizeText(city, { maxLen: 40 }),
    settlement: settle,
    photos: (Array.isArray(photos) ? photos : [])
      .map((p) => String(p).slice(0, 200))
      .slice(0, 5),
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reservedBy: null,
    soldTo: null,
    soldAt: null
  };
  state.listings.push(listing);
  return { ok: true, listing: { ...listing } };
}

export function updateListing(state, listingId, sellerId, patch = {}) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.sellerId !== String(sellerId)) return { ok: false, reason: "not_owner" };
  if (listing.status === "sold") return { ok: false, reason: "already_sold" };

  if (patch.title != null) {
    const t = sanitizeText(patch.title, { maxLen: 80 }).trim();
    if (t.length < 3) return { ok: false, reason: "title_too_short" };
    listing.title = t;
  }
  if (patch.description != null) {
    listing.description = sanitizeText(patch.description, { maxLen: 1200 });
  }
  if (patch.category != null && categoryOk(patch.category)) listing.category = patch.category;
  if (patch.condition != null && CONDITIONS.includes(patch.condition)) {
    listing.condition = patch.condition;
  }
  if (patch.priceYc != null) {
    const price = Math.round(Number(patch.priceYc) * 100) / 100;
    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE_YC) {
      return { ok: false, reason: "bad_price" };
    }
    listing.priceYc = price;
  }
  if (patch.city != null) listing.city = sanitizeText(patch.city, { maxLen: 40 });
  if (patch.settlement != null && ["yc", "meet", "either"].includes(patch.settlement)) {
    listing.settlement = patch.settlement;
  }
  listing.updatedAt = Date.now();
  return { ok: true, listing: { ...listing } };
}

export function withdrawListing(state, listingId, sellerId) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.sellerId !== String(sellerId)) return { ok: false, reason: "not_owner" };
  if (listing.status === "sold") return { ok: false, reason: "already_sold" };
  listing.status = "withdrawn";
  listing.reservedBy = null;
  listing.updatedAt = Date.now();
  return { ok: true, listing: { ...listing } };
}

export function searchListings(state, {
  query = "",
  category = null,
  status = "active",
  sellerId = null,
  maxPrice = null,
  city = null,
  limit = 50
} = {}) {
  const q = String(query || "")
    .toLowerCase()
    .trim();
  let list = state.listings.slice();
  if (status) list = list.filter((l) => l.status === status);
  if (category && categoryOk(category)) list = list.filter((l) => l.category === category);
  if (sellerId) list = list.filter((l) => l.sellerId === String(sellerId));
  if (maxPrice != null && Number.isFinite(Number(maxPrice))) {
    list = list.filter((l) => l.priceYc <= Number(maxPrice));
  }
  if (city) {
    const c = String(city).toLowerCase();
    list = list.filter((l) => (l.city || "").toLowerCase().includes(c));
  }
  if (q) {
    list = list.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  return list.slice(0, Math.min(100, Math.max(1, limit))).map((l) => ({ ...l }));
}

export function getListing(state, listingId) {
  const l = state.listings.find((x) => x.id === listingId);
  return l ? { ...l } : null;
}

/**
 * Buy with YC: buyer pays full price to seller; small platform fee debited from seller (burn/fee).
 */
export function purchaseListing(state, currencyState, { listingId, buyerId } = {}) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "active" && listing.status !== "reserved") {
    return { ok: false, reason: "not_available" };
  }
  if (listing.sellerId === String(buyerId)) return { ok: false, reason: "own_listing" };
  if (listing.settlement === "meet") {
    return { ok: false, reason: "meet_only", message: "Seller accepts meet/arrange only" };
  }

  const price = listing.priceYc;
  if (price <= 0) {
    listing.status = "sold";
    listing.soldTo = String(buyerId);
    listing.soldAt = Date.now();
    listing.updatedAt = Date.now();
    return { ok: true, listing: { ...listing }, paid: 0, fee: 0 };
  }

  ensureWallet(currencyState, buyerId);
  ensureWallet(currencyState, listing.sellerId);
  if (getBalance(currencyState, buyerId) < price) {
    return { ok: false, reason: "insufficient_funds" };
  }

  const fee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
  const sellerGets = Math.round((price - fee) * 100) / 100;

  const tx = transfer(currencyState, buyerId, listing.sellerId, price, {
    note: `marketplace:${listing.id}`
  });
  if (!tx.ok) return tx;

  if (fee > 0) {
    debit(currencyState, listing.sellerId, fee, {
      type: "fee",
      note: `marketplace_fee:${listing.id}`
    });
  }

  listing.status = "sold";
  listing.soldTo = String(buyerId);
  listing.soldAt = Date.now();
  listing.reservedBy = null;
  listing.updatedAt = Date.now();

  return {
    ok: true,
    listing: { ...listing },
    paid: price,
    sellerReceived: sellerGets,
    fee,
    buyerBalance: getBalance(currencyState, buyerId),
    sellerBalance: getBalance(currencyState, listing.sellerId)
  };
}

export function reserveListing(state, listingId, buyerId) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "active") return { ok: false, reason: "not_available" };
  if (listing.sellerId === String(buyerId)) return { ok: false, reason: "own_listing" };
  listing.status = "reserved";
  listing.reservedBy = String(buyerId);
  listing.updatedAt = Date.now();
  return { ok: true, listing: { ...listing } };
}

export function releaseReservation(state, listingId, actorId) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "reserved") return { ok: false, reason: "not_reserved" };
  const actor = String(actorId);
  if (listing.sellerId !== actor && listing.reservedBy !== actor) {
    return { ok: false, reason: "not_allowed" };
  }
  listing.status = "active";
  listing.reservedBy = null;
  listing.updatedAt = Date.now();
  return { ok: true, listing: { ...listing } };
}

export function markSoldMeet(state, listingId, sellerId, buyerId = null) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.sellerId !== String(sellerId)) return { ok: false, reason: "not_owner" };
  if (listing.status === "sold" || listing.status === "withdrawn") {
    return { ok: false, reason: "not_available" };
  }
  listing.status = "sold";
  listing.soldTo = buyerId ? String(buyerId) : listing.reservedBy;
  listing.soldAt = Date.now();
  listing.updatedAt = Date.now();
  return { ok: true, listing: { ...listing } };
}

export function summarizeMarketplace(state) {
  const active = state.listings.filter((l) => l.status === "active").length;
  return `${active} active · ${state.listings.length} total listings`;
}
