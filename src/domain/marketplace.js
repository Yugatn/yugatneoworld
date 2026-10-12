/**
 * Peer-to-peer marketplace (Avito-style classifieds).
 * Payments via payments.js: instant YC or escrow.
 */

import { ensureWallet, getBalance } from "./currency.js";
import { sanitizeText } from "./security.js";
import {
  createPayment,
  releaseEscrow,
  refundEscrow
} from "./payments.js";

export const LISTING_STATUSES = Object.freeze([
  "active",
  "reserved",
  "sold",
  "withdrawn"
]);

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
  preferEscrow = false,
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
    preferEscrow: Boolean(preferEscrow),
    photos: (Array.isArray(photos) ? photos : [])
      .map((p) => String(p).slice(0, 200))
      .slice(0, 5),
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reservedBy: null,
    soldTo: null,
    soldAt: null,
    paymentOrderId: null
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
  if (patch.preferEscrow != null) listing.preferEscrow = Boolean(patch.preferEscrow);
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
 * Checkout: instant YC or escrow.
 * escrow=true | listing.preferEscrow → hold funds until confirmPurchase.
 */
export function purchaseListing(
  state,
  currencyState,
  paymentsState,
  { listingId, buyerId, escrow = null } = {}
) {
  // Back-compat: old signature purchaseListing(state, currency, { listingId, buyerId })
  if (paymentsState && typeof paymentsState === "object" && paymentsState.listingId) {
    const opts = paymentsState;
    paymentsState = null;
    listingId = opts.listingId;
    buyerId = opts.buyerId;
    escrow = opts.escrow;
  }

  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status !== "active" && listing.status !== "reserved") {
    return { ok: false, reason: "not_available" };
  }
  if (listing.sellerId === String(buyerId)) return { ok: false, reason: "own_listing" };
  if (listing.settlement === "meet") {
    return { ok: false, reason: "meet_only", message: "Seller accepts meet/arrange only" };
  }

  const useEscrow =
    escrow === true || (escrow !== false && listing.preferEscrow === true);
  const method = useEscrow ? "yc_escrow" : "yc_instant";

  // Without payments state — legacy instant path via createPayment still needs paymentsState
  if (!paymentsState) {
    return { ok: false, reason: "payments_required" };
  }

  ensureWallet(currencyState, buyerId);
  ensureWallet(currencyState, listing.sellerId);

  const pay = createPayment(paymentsState, currencyState, {
    buyerId,
    sellerId: listing.sellerId,
    amount: listing.priceYc,
    method,
    refType: "marketplace",
    refId: listing.id,
    note: listing.title.slice(0, 80),
    platformFeeRate: PLATFORM_FEE_RATE,
    autoComplete: true
  });
  if (!pay.ok) return pay;

  listing.paymentOrderId = pay.order.id;
  listing.soldTo = String(buyerId);
  listing.updatedAt = Date.now();
  listing.reservedBy = null;

  if (method === "yc_instant") {
    listing.status = "sold";
    listing.soldAt = Date.now();
  } else {
    // escrow: reserved until release
    listing.status = "reserved";
    listing.reservedBy = String(buyerId);
  }

  return {
    ok: true,
    listing: { ...listing },
    order: pay.order,
    method,
    paid: listing.priceYc,
    fee: pay.order.fee,
    buyerBalance: getBalance(currencyState, buyerId),
    sellerBalance: getBalance(currencyState, listing.sellerId)
  };
}

/** Buyer confirms receipt → release escrow, mark sold. */
export function confirmPurchase(
  state,
  currencyState,
  paymentsState,
  { listingId, buyerId } = {}
) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (!listing.paymentOrderId) return { ok: false, reason: "no_payment" };
  if (String(buyerId) !== listing.soldTo && String(buyerId) !== listing.reservedBy) {
    return { ok: false, reason: "not_buyer" };
  }

  const rel = releaseEscrow(paymentsState, currencyState, listing.paymentOrderId, {
    actorId: buyerId
  });
  if (!rel.ok) return rel;

  listing.status = "sold";
  listing.soldAt = Date.now();
  listing.soldTo = String(buyerId);
  listing.reservedBy = null;
  listing.updatedAt = Date.now();

  return {
    ok: true,
    listing: { ...listing },
    order: rel.order,
    sellerReceived: rel.sellerReceived,
    fee: rel.fee
  };
}

/** Cancel escrow deal → refund buyer, listing active again. */
export function cancelPurchase(
  state,
  currencyState,
  paymentsState,
  { listingId, actorId, reason = "cancelled" } = {}
) {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return { ok: false, reason: "not_found" };
  if (!listing.paymentOrderId) return { ok: false, reason: "no_payment" };

  const ref = refundEscrow(paymentsState, currencyState, listing.paymentOrderId, {
    actorId,
    reason
  });
  if (!ref.ok) return ref;

  listing.status = "active";
  listing.soldTo = null;
  listing.reservedBy = null;
  listing.paymentOrderId = null;
  listing.updatedAt = Date.now();

  return { ok: true, listing: { ...listing }, order: ref.order };
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
  if (listing.paymentOrderId) {
    return { ok: false, reason: "payment_in_progress", message: "Use cancelPurchase for escrow" };
  }
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
  if (listing.paymentOrderId) return { ok: false, reason: "payment_in_progress" };
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
