/**
 * Payments layer for eWorld (YC only — not fiat).
 * Instant pay, escrow (hold → release / refund), receipts, auto-release helper.
 */

import {
  ensureWallet,
  getBalance,
  debit,
  credit,
  transfer,
  CURRENCY_CODE
} from "./currency.js";

export const PAYMENT_STATUSES = Object.freeze([
  "pending",
  "held",
  "completed",
  "refunded",
  "cancelled"
]);

export const PAYMENT_METHODS = Object.freeze(["yc_instant", "yc_escrow"]);

/** Default escrow auto-release after 7 days (ms) — caller may pass custom. */
export const DEFAULT_ESCROW_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createPaymentsState(seed = {}) {
  return {
    orders: Array.isArray(seed.orders) ? seed.orders.map((o) => ({ ...o })) : [],
    /** sellerId → { sum, count, lastAt } */
    ratings: seed.ratings && typeof seed.ratings === "object" ? { ...seed.ratings } : {},
    /** orderId → receipt snapshot */
    receipts: Array.isArray(seed.receipts) ? seed.receipts.map((r) => ({ ...r })) : []
  };
}

const ESCROW_ACCOUNT = "__escrow__";

function pushReceipt(state, order, extra = {}) {
  const receipt = {
    id: uid("rcpt"),
    orderId: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    amount: order.amount,
    fee: order.fee || 0,
    currency: CURRENCY_CODE,
    method: order.method,
    status: order.status,
    refType: order.refType,
    refId: order.refId,
    note: order.note,
    at: Date.now(),
    ...extra
  };
  state.receipts.push(receipt);
  if (state.receipts.length > 300) state.receipts = state.receipts.slice(-300);
  return receipt;
}

export function listOrders(state, userId, { role = "any", limit = 30 } = {}) {
  const id = String(userId);
  let list = state.orders.filter((o) => {
    if (role === "buyer") return o.buyerId === id;
    if (role === "seller") return o.sellerId === id;
    return o.buyerId === id || o.sellerId === id;
  });
  list = list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, limit).map((o) => ({ ...o }));
}

export function getOrder(state, orderId) {
  const o = state.orders.find((x) => x.id === orderId);
  return o ? { ...o } : null;
}

export function listReceipts(state, userId, { limit = 20 } = {}) {
  const id = String(userId);
  return state.receipts
    .filter((r) => r.buyerId === id || r.sellerId === id)
    .slice(-limit)
    .reverse()
    .map((r) => ({ ...r }));
}

export function createPayment(state, currencyState, {
  buyerId,
  sellerId,
  amount,
  method = "yc_instant",
  refType = "generic",
  refId = null,
  note = "",
  platformFeeRate = 0,
  escrowTtlMs = DEFAULT_ESCROW_TTL_MS
} = {}) {
  const bid = String(buyerId);
  const sid = String(sellerId);
  if (bid === sid) return { ok: false, reason: "same_user" };

  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n < 0) return { ok: false, reason: "bad_amount" };
  if (!PAYMENT_METHODS.includes(method)) return { ok: false, reason: "bad_method" };

  ensureWallet(currencyState, bid);
  ensureWallet(currencyState, sid);
  ensureWallet(currencyState, ESCROW_ACCOUNT, { initial: 0 });

  if (n > 0 && getBalance(currencyState, bid) < n) {
    return { ok: false, reason: "insufficient_funds", balance: getBalance(currencyState, bid) };
  }

  const fee = Math.round(n * Math.max(0, Number(platformFeeRate) || 0) * 100) / 100;
  const order = {
    id: uid("pay"),
    buyerId: bid,
    sellerId: sid,
    amount: n,
    fee,
    currency: CURRENCY_CODE,
    method,
    status: "pending",
    refType: String(refType).slice(0, 32),
    refId: refId ? String(refId).slice(0, 64) : null,
    note: String(note).slice(0, 120),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null,
    refundedAt: null,
    releaseAfter: null,
    rated: false
  };

  if (n === 0) {
    order.status = "completed";
    order.completedAt = Date.now();
    state.orders.push(order);
    const receipt = pushReceipt(state, order);
    return { ok: true, order: { ...order }, receipt };
  }

  if (method === "yc_instant") {
    const tx = transfer(currencyState, bid, sid, n, {
      note: `pay:${order.id}:${order.refType}`
    });
    if (!tx.ok) return tx;
    if (fee > 0) {
      debit(currencyState, sid, fee, { type: "fee", note: `pay_fee:${order.id}` });
    }
    order.status = "completed";
    order.completedAt = Date.now();
    state.orders.push(order);
    const receipt = pushReceipt(state, order, { event: "instant_complete" });
    return {
      ok: true,
      order: { ...order },
      receipt,
      buyerBalance: getBalance(currencyState, bid),
      sellerBalance: getBalance(currencyState, sid)
    };
  }

  const deb = debit(currencyState, bid, n, {
    type: "purchase",
    note: `escrow_hold:${order.id}`
  });
  if (!deb.ok) return deb;
  credit(currencyState, ESCROW_ACCOUNT, n, {
    type: "transfer",
    note: `escrow_hold:${order.id}`
  });
  order.status = "held";
  order.releaseAfter = Date.now() + Math.max(60_000, Number(escrowTtlMs) || DEFAULT_ESCROW_TTL_MS);
  state.orders.push(order);
  const receipt = pushReceipt(state, order, { event: "escrow_hold" });

  return {
    ok: true,
    order: { ...order },
    receipt,
    buyerBalance: getBalance(currencyState, bid),
    escrowBalance: getBalance(currencyState, ESCROW_ACCOUNT)
  };
}

export function releaseEscrow(state, currencyState, orderId, {
  actorId = null,
  asAdmin = false
} = {}) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "held") return { ok: false, reason: "not_held" };
  if (!asAdmin && actorId && String(actorId) !== order.buyerId && String(actorId) !== order.sellerId) {
    return { ok: false, reason: "not_allowed" };
  }

  const n = order.amount;
  const fee = order.fee || 0;
  ensureWallet(currencyState, ESCROW_ACCOUNT, { initial: 0 });
  if (getBalance(currencyState, ESCROW_ACCOUNT) < n) {
    return { ok: false, reason: "escrow_short" };
  }

  debit(currencyState, ESCROW_ACCOUNT, n, {
    type: "transfer",
    note: `escrow_release:${order.id}`
  });
  const toSeller = Math.round((n - fee) * 100) / 100;
  if (toSeller > 0) {
    credit(currencyState, order.sellerId, toSeller, {
      type: "transfer",
      note: `escrow_release:${order.id}`
    });
  }
  if (fee > 0) {
    currencyState.totalBurned = (currencyState.totalBurned || 0) + fee;
  }

  order.status = "completed";
  order.completedAt = Date.now();
  order.updatedAt = Date.now();
  const receipt = pushReceipt(state, order, { event: "escrow_release", sellerReceived: toSeller });

  return {
    ok: true,
    order: { ...order },
    receipt,
    sellerReceived: toSeller,
    fee,
    sellerBalance: getBalance(currencyState, order.sellerId)
  };
}

export function refundEscrow(state, currencyState, orderId, {
  actorId = null,
  asAdmin = false,
  reason = ""
} = {}) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "held") return { ok: false, reason: "not_held" };
  if (
    !asAdmin &&
    actorId &&
    String(actorId) !== order.buyerId &&
    String(actorId) !== order.sellerId
  ) {
    return { ok: false, reason: "not_allowed" };
  }

  const n = order.amount;
  ensureWallet(currencyState, ESCROW_ACCOUNT, { initial: 0 });
  if (getBalance(currencyState, ESCROW_ACCOUNT) < n) {
    return { ok: false, reason: "escrow_short" };
  }

  debit(currencyState, ESCROW_ACCOUNT, n, {
    type: "refund",
    note: `escrow_refund:${order.id}`
  });
  credit(currencyState, order.buyerId, n, {
    type: "refund",
    note: `escrow_refund:${order.id}:${String(reason).slice(0, 40)}`
  });

  order.status = "refunded";
  order.refundedAt = Date.now();
  order.updatedAt = Date.now();
  order.note = (order.note + " | refund: " + String(reason).slice(0, 60)).slice(0, 120);
  const receipt = pushReceipt(state, order, { event: "escrow_refund", reason: String(reason).slice(0, 80) });

  return {
    ok: true,
    order: { ...order },
    receipt,
    buyerBalance: getBalance(currencyState, order.buyerId)
  };
}

/** Release all held orders past releaseAfter (call on tick / cron). */
export function autoReleaseExpired(state, currencyState, { now = Date.now() } = {}) {
  const released = [];
  for (const order of state.orders) {
    if (order.status !== "held") continue;
    if (!order.releaseAfter || order.releaseAfter > now) continue;
    const r = releaseEscrow(state, currencyState, order.id, { asAdmin: true });
    if (r.ok) released.push(r.order.id);
  }
  return { ok: true, released };
}

export function cancelOrder(state, orderId, actorId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "pending") return { ok: false, reason: "not_pending" };
  if (String(actorId) !== order.buyerId && String(actorId) !== order.sellerId) {
    return { ok: false, reason: "not_allowed" };
  }
  order.status = "cancelled";
  order.updatedAt = Date.now();
  return { ok: true, order: { ...order } };
}

/** Buyer rates seller after completed order (1–5). */
export function rateSeller(state, orderId, buyerId, stars, { comment = "" } = {}) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "completed") return { ok: false, reason: "not_completed" };
  if (order.buyerId !== String(buyerId)) return { ok: false, reason: "not_buyer" };
  if (order.rated) return { ok: false, reason: "already_rated" };

  const s = Math.round(Number(stars));
  if (!Number.isFinite(s) || s < 1 || s > 5) return { ok: false, reason: "bad_stars" };

  const sid = order.sellerId;
  const prev = state.ratings[sid] || { sum: 0, count: 0, lastAt: 0 };
  prev.sum += s;
  prev.count += 1;
  prev.lastAt = Date.now();
  state.ratings[sid] = prev;
  order.rated = true;
  order.ratingStars = s;
  order.ratingComment = String(comment).slice(0, 200);
  order.updatedAt = Date.now();

  return {
    ok: true,
    order: { ...order },
    sellerRating: getSellerRating(state, sid)
  };
}

export function getSellerRating(state, sellerId) {
  const r = state.ratings[String(sellerId)];
  if (!r || !r.count) return { avg: null, count: 0 };
  return {
    avg: Math.round((r.sum / r.count) * 10) / 10,
    count: r.count,
    lastAt: r.lastAt
  };
}

export function summarizePayments(state) {
  const held = state.orders.filter((o) => o.status === "held").length;
  const done = state.orders.filter((o) => o.status === "completed").length;
  return `${done} completed · ${held} in escrow · ${state.orders.length} orders · ${state.receipts.length} receipts`;
}
