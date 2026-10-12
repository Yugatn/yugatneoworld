/**
 * Crypto payment intents + P2P exchanger board (in-world model).
 *
 * IMPORTANT: symbolic domain only. No private keys, no on-chain broadcast,
 * no real fiat rails. Rates are demo reference prices for UX/simulation.
 * Production on-chain settlement would require a separate licensed stack.
 */

import { ensureWallet, getBalance, debit, credit } from "./currency.js";
import { sanitizeText } from "./security.js";

/** Supported crypto symbols (labels only). */
export const CRYPTO_ASSETS = Object.freeze([
  { id: "USDT", name: "Tether USD", decimals: 2 },
  { id: "BTC", name: "Bitcoin", decimals: 8 },
  { id: "ETH", name: "Ethereum", decimals: 6 },
  { id: "TON", name: "Toncoin", decimals: 4 }
]);

/** Demo reference: how many YC for 1 unit of asset (not a market feed). */
export const DEMO_RATES_YC = Object.freeze({
  USDT: 1,
  BTC: 95_000,
  ETH: 3_200,
  TON: 5
});

export const OFFER_SIDES = Object.freeze(["sell_yc", "buy_yc"]);
export const OFFER_STATUSES = Object.freeze(["open", "locked", "completed", "cancelled"]);
export const DEAL_STATUSES = Object.freeze([
  "pending_crypto",
  "crypto_marked",
  "completed",
  "disputed",
  "cancelled"
]);

export const PAY_INTENT_STATUSES = Object.freeze([
  "awaiting_tx",
  "tx_submitted",
  "confirmed",
  "expired",
  "cancelled"
]);

/** Registry of P2P desk integrations (stubs — deep links / partner ids only). */
export const P2P_EXCHANGERS = Object.freeze([
  {
    id: "local_desk",
    name: "Local P2P Desk",
    nameRu: "Локальный P2P-стол",
    kind: "in_world",
    assets: ["USDT", "TON"],
    url: null
  },
  {
    id: "partner_board",
    name: "Partner Board",
    nameRu: "Партнёрская доска",
    kind: "external_link",
    assets: ["USDT", "BTC", "ETH"],
    url: "https://example.com/p2p-partner" // placeholder partner landing
  },
  {
    id: "community_otc",
    name: "Community OTC",
    nameRu: "Сообщество OTC",
    kind: "in_world",
    assets: ["USDT", "BTC", "ETH", "TON"],
    url: null
  }
]);

export const MAX_OPEN_OFFERS = 10;
export const INTENT_TTL_MS = 30 * 60 * 1000;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function assetOk(id) {
  return CRYPTO_ASSETS.some((a) => a.id === id);
}

export function createCryptoP2PState(seed = {}) {
  return {
    offers: Array.isArray(seed.offers) ? seed.offers.map((o) => ({ ...o })) : [],
    deals: Array.isArray(seed.deals) ? seed.deals.map((d) => ({ ...d })) : [],
    /** Crypto payment intents (pay for marketplace/shop with crypto memo). */
    intents: Array.isArray(seed.intents) ? seed.intents.map((i) => ({ ...i })) : [],
    /** Optional per-user preferred receive address labels (not secrets). */
    addressBooks:
      seed.addressBooks && typeof seed.addressBooks === "object"
        ? { ...seed.addressBooks }
        : {}
  };
}

export function listExchangers({ asset = null } = {}) {
  let list = P2P_EXCHANGERS.slice();
  if (asset && assetOk(asset)) {
    list = list.filter((e) => e.assets.includes(asset));
  }
  return list.map((e) => ({ ...e }));
}

export function getDemoRate(assetId) {
  return DEMO_RATES_YC[assetId] != null ? DEMO_RATES_YC[assetId] : null;
}

/** Estimate YC for crypto amount at demo rate. */
export function estimateYc(assetId, cryptoAmount) {
  const rate = getDemoRate(assetId);
  if (rate == null) return { ok: false, reason: "unknown_asset" };
  const n = Number(cryptoAmount);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  const yc = Math.round(n * rate * 100) / 100;
  return { ok: true, assetId, cryptoAmount: n, yc, rate };
}

/**
 * Publish P2P offer.
 * sell_yc: maker sells YC, wants crypto (YC locked in hold account).
 * buy_yc: maker wants YC, pays crypto off-platform (no YC lock).
 */
export function createOffer(state, currencyState, {
  makerId,
  side = "sell_yc",
  asset = "USDT",
  ycAmount,
  cryptoAmount = null,
  rate = null,
  exchangerId = "local_desk",
  memo = ""
} = {}) {
  const mid = String(makerId || "local");
  if (!OFFER_SIDES.includes(side)) return { ok: false, reason: "bad_side" };
  if (!assetOk(asset)) return { ok: false, reason: "unknown_asset" };
  if (!P2P_EXCHANGERS.some((e) => e.id === exchangerId)) {
    return { ok: false, reason: "unknown_exchanger" };
  }

  const openCount = state.offers.filter((o) => o.makerId === mid && o.status === "open").length;
  if (openCount >= MAX_OPEN_OFFERS) return { ok: false, reason: "too_many_open" };

  let yc = Math.round(Number(ycAmount) * 100) / 100;
  if (!Number.isFinite(yc) || yc <= 0) return { ok: false, reason: "bad_yc_amount" };
  if (yc > 100_000) return { ok: false, reason: "yc_too_high" };

  let crypto = cryptoAmount != null ? Number(cryptoAmount) : null;
  let usedRate = rate != null ? Number(rate) : getDemoRate(asset);
  if (crypto == null && usedRate) {
    crypto = Math.round((yc / usedRate) * 1e8) / 1e8;
  }
  if (!Number.isFinite(crypto) || crypto <= 0) return { ok: false, reason: "bad_crypto_amount" };
  if (!Number.isFinite(usedRate) || usedRate <= 0) {
    usedRate = Math.round((yc / crypto) * 100) / 100;
  }

  if (side === "sell_yc") {
    ensureWallet(currencyState, mid);
    if (getBalance(currencyState, mid) < yc) {
      return { ok: false, reason: "insufficient_yc" };
    }
    const hold = `__p2p_hold_${mid}`;
    ensureWallet(currencyState, hold, { initial: 0 });
    const deb = debit(currencyState, mid, yc, { type: "purchase", note: "p2p_offer_lock" });
    if (!deb.ok) return deb;
    credit(currencyState, hold, yc, { type: "transfer", note: "p2p_offer_lock" });
  }

  const offer = {
    id: uid("p2p"),
    makerId: mid,
    side,
    asset,
    ycAmount: yc,
    cryptoAmount: crypto,
    rate: usedRate,
    exchangerId,
    memo: sanitizeText(memo, { maxLen: 120 }),
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lockedBy: null,
    dealId: null
  };
  state.offers.push(offer);
  return { ok: true, offer: { ...offer } };
}

export function cancelOffer(state, currencyState, offerId, makerId) {
  const offer = state.offers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, reason: "not_found" };
  if (offer.makerId !== String(makerId)) return { ok: false, reason: "not_owner" };
  if (offer.status !== "open") return { ok: false, reason: "not_open" };

  if (offer.side === "sell_yc") {
    const hold = `__p2p_hold_${offer.makerId}`;
    ensureWallet(currencyState, hold, { initial: 0 });
    const bal = getBalance(currencyState, hold);
    const release = Math.min(bal, offer.ycAmount);
    if (release > 0) {
      debit(currencyState, hold, release, { type: "refund", note: `p2p_cancel:${offer.id}` });
      credit(currencyState, offer.makerId, release, {
        type: "refund",
        note: `p2p_cancel:${offer.id}`
      });
    }
  }

  offer.status = "cancelled";
  offer.updatedAt = Date.now();
  return { ok: true, offer: { ...offer } };
}

export function searchOffers(state, {
  side = null,
  asset = null,
  exchangerId = null,
  status = "open",
  limit = 40
} = {}) {
  let list = state.offers.slice();
  if (status) list = list.filter((o) => o.status === status);
  if (side) list = list.filter((o) => o.side === side);
  if (asset && assetOk(asset)) list = list.filter((o) => o.asset === asset);
  if (exchangerId) list = list.filter((o) => o.exchangerId === exchangerId);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, limit).map((o) => ({ ...o }));
}

/**
 * Taker locks offer → deal. For sell_yc: YC already in maker hold;
 * on complete, YC moves to taker. Crypto transfer is off-band (user marks sent).
 */
export function takeOffer(state, offerId, takerId) {
  const offer = state.offers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, reason: "not_found" };
  if (offer.status !== "open") return { ok: false, reason: "not_open" };
  if (offer.makerId === String(takerId)) return { ok: false, reason: "own_offer" };

  const deal = {
    id: uid("deal"),
    offerId: offer.id,
    makerId: offer.makerId,
    takerId: String(takerId),
    side: offer.side,
    asset: offer.asset,
    ycAmount: offer.ycAmount,
    cryptoAmount: offer.cryptoAmount,
    exchangerId: offer.exchangerId,
    status: "pending_crypto",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cryptoTxHint: null,
    completedAt: null
  };

  offer.status = "locked";
  offer.lockedBy = String(takerId);
  offer.dealId = deal.id;
  offer.updatedAt = Date.now();
  state.deals.push(deal);

  return { ok: true, deal: { ...deal }, offer: { ...offer } };
}

/** Party marks that crypto was sent (memo / tx id string only — not verified on-chain). */
export function markCryptoSent(state, dealId, actorId, { txHint = "" } = {}) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return { ok: false, reason: "not_found" };
  if (deal.status !== "pending_crypto") return { ok: false, reason: "bad_status" };
  const actor = String(actorId);
  if (actor !== deal.makerId && actor !== deal.takerId) {
    return { ok: false, reason: "not_party" };
  }
  deal.status = "crypto_marked";
  deal.cryptoTxHint = sanitizeText(txHint, { maxLen: 120 });
  deal.updatedAt = Date.now();
  return { ok: true, deal: { ...deal } };
}

/**
 * Complete deal after parties agree crypto moved.
 * sell_yc: hold → taker receives YC
 * buy_yc: maker should receive YC from taker — debit taker credit maker
 */
export function completeDeal(state, currencyState, dealId, actorId) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return { ok: false, reason: "not_found" };
  if (deal.status !== "crypto_marked" && deal.status !== "pending_crypto") {
    return { ok: false, reason: "bad_status" };
  }
  const actor = String(actorId);
  if (actor !== deal.makerId && actor !== deal.takerId) {
    return { ok: false, reason: "not_party" };
  }

  const yc = deal.ycAmount;
  if (deal.side === "sell_yc") {
    const hold = `__p2p_hold_${deal.makerId}`;
    ensureWallet(currencyState, hold, { initial: 0 });
    ensureWallet(currencyState, deal.takerId);
    if (getBalance(currencyState, hold) < yc) return { ok: false, reason: "hold_short" };
    debit(currencyState, hold, yc, { type: "transfer", note: `p2p_complete:${deal.id}` });
    credit(currencyState, deal.takerId, yc, {
      type: "transfer",
      note: `p2p_complete:${deal.id}`
    });
  } else {
    // buy_yc: taker sells YC to maker
    ensureWallet(currencyState, deal.takerId);
    ensureWallet(currencyState, deal.makerId);
    if (getBalance(currencyState, deal.takerId) < yc) {
      return { ok: false, reason: "insufficient_yc" };
    }
    debit(currencyState, deal.takerId, yc, {
      type: "transfer",
      note: `p2p_complete:${deal.id}`
    });
    credit(currencyState, deal.makerId, yc, {
      type: "transfer",
      note: `p2p_complete:${deal.id}`
    });
  }

  deal.status = "completed";
  deal.completedAt = Date.now();
  deal.updatedAt = Date.now();

  const offer = state.offers.find((o) => o.id === deal.offerId);
  if (offer) {
    offer.status = "completed";
    offer.updatedAt = Date.now();
  }

  return {
    ok: true,
    deal: { ...deal },
    takerBalance: getBalance(currencyState, deal.takerId),
    makerBalance: getBalance(currencyState, deal.makerId)
  };
}

export function cancelDeal(state, currencyState, dealId, actorId) {
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return { ok: false, reason: "not_found" };
  if (deal.status === "completed") return { ok: false, reason: "already_done" };
  const actor = String(actorId);
  if (actor !== deal.makerId && actor !== deal.takerId) {
    return { ok: false, reason: "not_party" };
  }

  deal.status = "cancelled";
  deal.updatedAt = Date.now();

  const offer = state.offers.find((o) => o.id === deal.offerId);
  if (offer && offer.status === "locked") {
    // re-open offer
    offer.status = "open";
    offer.lockedBy = null;
    offer.dealId = null;
    offer.updatedAt = Date.now();
  }

  return { ok: true, deal: { ...deal } };
}

/**
 * Crypto payment intent for in-world purchase (shop/marketplace).
 * User is shown amount + memo; later marks tx submitted; admin/system confirms → credit YC or mark order paid.
 */
export function createCryptoPayIntent(state, {
  userId,
  asset = "USDT",
  ycAmount,
  refType = "generic",
  refId = null,
  note = ""
} = {}) {
  if (!assetOk(asset)) return { ok: false, reason: "unknown_asset" };
  const est = estimateYc(asset, 1);
  const yc = Math.round(Number(ycAmount) * 100) / 100;
  if (!Number.isFinite(yc) || yc <= 0) return { ok: false, reason: "bad_yc_amount" };
  const rate = getDemoRate(asset);
  const cryptoAmount = Math.round((yc / rate) * 1e8) / 1e8;
  const memo = `EW-${uid("m").slice(-8)}`;

  const intent = {
    id: uid("cint"),
    userId: String(userId || "local"),
    asset,
    ycAmount: yc,
    cryptoAmount,
    rate,
    memo,
    refType: String(refType).slice(0, 32),
    refId: refId ? String(refId).slice(0, 64) : null,
    note: sanitizeText(note, { maxLen: 80 }),
    status: "awaiting_tx",
    createdAt: Date.now(),
    expiresAt: Date.now() + INTENT_TTL_MS,
    txHint: null,
    confirmedAt: null
  };
  state.intents.push(intent);
  return { ok: true, intent: { ...intent }, estimate: est };
}

export function submitCryptoTx(state, intentId, userId, { txHint = "" } = {}) {
  const intent = state.intents.find((i) => i.id === intentId);
  if (!intent) return { ok: false, reason: "not_found" };
  if (intent.userId !== String(userId)) return { ok: false, reason: "not_owner" };
  if (intent.status !== "awaiting_tx") return { ok: false, reason: "bad_status" };
  if (Date.now() > intent.expiresAt) {
    intent.status = "expired";
    return { ok: false, reason: "expired" };
  }
  intent.status = "tx_submitted";
  intent.txHint = sanitizeText(txHint, { maxLen: 120 });
  return { ok: true, intent: { ...intent } };
}

/** Confirm intent and mint/credit YC to user (demo settlement). */
export function confirmCryptoPayIntent(state, currencyState, intentId, { asSystem = true } = {}) {
  if (!asSystem) return { ok: false, reason: "system_only" };
  const intent = state.intents.find((i) => i.id === intentId);
  if (!intent) return { ok: false, reason: "not_found" };
  if (intent.status !== "tx_submitted" && intent.status !== "awaiting_tx") {
    return { ok: false, reason: "bad_status" };
  }
  ensureWallet(currencyState, intent.userId);
  credit(currencyState, intent.userId, intent.ycAmount, {
    type: "mint",
    note: `crypto_pay:${intent.id}:${intent.asset}`
  });
  intent.status = "confirmed";
  intent.confirmedAt = Date.now();
  return {
    ok: true,
    intent: { ...intent },
    balance: getBalance(currencyState, intent.userId)
  };
}

export function setReceiveLabel(state, userId, asset, label) {
  if (!assetOk(asset)) return { ok: false, reason: "unknown_asset" };
  const id = String(userId);
  if (!state.addressBooks[id]) state.addressBooks[id] = {};
  state.addressBooks[id][asset] = sanitizeText(label, { maxLen: 80 });
  return { ok: true, label: state.addressBooks[id][asset] };
}

export function summarizeCryptoP2P(state) {
  const open = state.offers.filter((o) => o.status === "open").length;
  const deals = state.deals.filter((d) => d.status !== "completed" && d.status !== "cancelled").length;
  return `${open} open offers · ${deals} active deals · ${state.intents.length} pay intents`;
}
