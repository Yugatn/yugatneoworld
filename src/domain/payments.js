/**
 * Payments layer for eWorld (YC only — not fiat).
 * Supports instant pay and escrow (hold → release / refund).
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
  "held", // escrow: funds taken from buyer, not yet with seller
  "completed",
  "refunded",
  "cancelled"
]);

export const PAYMENT_METHODS = Object.freeze(["yc_instant", "yc_escrow"]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createPaymentsState(seed = {}) {
  return {
    orders: Array.isArray(seed.orders) ? seed.orders.map((o) => ({ ...o })) : [],
    /** escrow pool userId is virtual — tracked as balance key __escrow__ */
  };
}

const ESCROW_ACCOUNT = "__escrow__";

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

/**
 * Create a payment order and optionally capture funds.
 * method:
 *  - yc_instant: transfer buyer → seller immediately (optional feeCb)
 *  - yc_escrow: debit buyer → escrow; release later
 */
export function createPayment(state, currencyState, {
  buyerId,
  sellerId,
  amount,
  method = "yc_instant",
  refType = "generic",
  refId = null,
  note = "",
  platformFeeRate = 0,
  autoComplete = true
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
    refundedAt: null
  };

  if (n === 0) {
    order.status = "completed";
    order.completedAt = Date.now();
    state.orders.push(order);
    return { ok: true, order: { ...order } };
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
    return {
      ok: true,
      order: { ...order },
      buyerBalance: getBalance(currencyState, bid),
      sellerBalance: getBalance(currencyState, sid)
    };
  }

  // escrow: move to escrow account
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
  state.orders.push(order);

  if (autoComplete === false) {
    return {
      ok: true,
      order: { ...order },
      buyerBalance: getBalance(currencyState, bid),
      escrowBalance: getBalance(currencyState, ESCROW_ACCOUNT)
    };
  }

  return {
    ok: true,
    order: { ...order },
    buyerBalance: getBalance(currencyState, bid),
    escrowBalance: getBalance(currencyState, ESCROW_ACCOUNT)
  };
}

/** Release escrow to seller (buyer confirms receipt / auto after timeout in prod). */
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
    // fee stays burned from circulation (not credited to seller)
    currencyState.totalBurned = (currencyState.totalBurned || 0) + fee;
  }

  order.status = "completed";
  order.completedAt = Date.now();
  order.updatedAt = Date.now();
  return {
    ok: true,
    order: { ...order },
    sellerReceived: toSeller,
    fee,
    sellerBalance: getBalance(currencyState, order.sellerId)
  };
}

/** Refund held escrow to buyer. */
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

  return {
    ok: true,
    order: { ...order },
    buyerBalance: getBalance(currencyState, order.buyerId)
  };
}

/** Cancel pending (no funds moved) — rare for our flows. */
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

export function summarizePayments(state) {
  const held = state.orders.filter((o) => o.status === "held").length;
  const done = state.orders.filter((o) => o.status === "completed").length;
  return `${done} completed · ${held} in escrow · ${state.orders.length} orders`;
}
