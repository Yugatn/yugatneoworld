/**
 * Internal currency: Yugatn Coin (YC).
 * Symbolic in-world money for shops, cinema, travel drafts, transfers.
 * Not real money; no fiat exchange in v0.1.
 */

export const CURRENCY_CODE = "YC";
export const CURRENCY_NAME = "Yugatn Coin";
export const CURRENCY_NAME_RU = "Югатн-коин";

/** Starting balance for new wallets. */
export const DEFAULT_BALANCE = 100;

export const TX_TYPES = Object.freeze([
  "mint",
  "burn",
  "transfer",
  "purchase",
  "refund",
  "reward",
  "fee"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createCurrencyState(seed = {}) {
  return {
    code: CURRENCY_CODE,
    /** userId → balance */
    balances: seed.balances && typeof seed.balances === "object" ? { ...seed.balances } : {},
    /** ledger entries (newest last, cap 500) */
    ledger: Array.isArray(seed.ledger) ? seed.ledger.map((t) => ({ ...t })) : [],
    totalMinted: Number(seed.totalMinted) || 0,
    totalBurned: Number(seed.totalBurned) || 0
  };
}

export function ensureWallet(state, userId, { initial = DEFAULT_BALANCE } = {}) {
  const id = String(userId || "local");
  if (state.balances[id] == null) {
    state.balances[id] = Math.max(0, Number(initial) || 0);
    if (state.balances[id] > 0) {
      state.totalMinted += state.balances[id];
      pushTx(state, {
        type: "mint",
        to: id,
        amount: state.balances[id],
        note: "opening balance"
      });
    }
  }
  return state.balances[id];
}

export function getBalance(state, userId) {
  const id = String(userId || "local");
  return state.balances[id] != null ? state.balances[id] : 0;
}

function pushTx(state, entry) {
  state.ledger.push({
    id: uid("tx"),
    at: Date.now(),
    currency: CURRENCY_CODE,
    ...entry
  });
  if (state.ledger.length > 500) state.ledger = state.ledger.slice(-500);
}

export function credit(state, userId, amount, { type = "reward", note = "" } = {}) {
  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  const id = String(userId || "local");
  ensureWallet(state, id, { initial: 0 });
  state.balances[id] = Math.round((state.balances[id] + n) * 100) / 100;
  if (type === "mint") state.totalMinted += n;
  pushTx(state, { type, to: id, amount: n, note: String(note).slice(0, 120) });
  return { ok: true, balance: state.balances[id], amount: n };
}

export function debit(state, userId, amount, { type = "purchase", note = "" } = {}) {
  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  const id = String(userId || "local");
  ensureWallet(state, id, { initial: 0 });
  if (state.balances[id] < n) return { ok: false, reason: "insufficient_funds", balance: state.balances[id] };
  state.balances[id] = Math.round((state.balances[id] - n) * 100) / 100;
  if (type === "burn") state.totalBurned += n;
  pushTx(state, { type, from: id, amount: n, note: String(note).slice(0, 120) });
  return { ok: true, balance: state.balances[id], amount: n };
}

export function transfer(state, fromId, toId, amount, { note = "" } = {}) {
  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "bad_amount" };
  if (String(fromId) === String(toId)) return { ok: false, reason: "same_user" };
  const deb = debit(state, fromId, n, { type: "transfer", note });
  if (!deb.ok) return deb;
  credit(state, toId, n, { type: "transfer", note });
  // fix double ledger: last two entries — rewrite as one transfer
  state.ledger = state.ledger.slice(0, -2);
  pushTx(state, {
    type: "transfer",
    from: String(fromId),
    to: String(toId),
    amount: n,
    note: String(note).slice(0, 120)
  });
  return {
    ok: true,
    fromBalance: getBalance(state, fromId),
    toBalance: getBalance(state, toId),
    amount: n
  };
}

export function listTransactions(state, userId, { limit = 20 } = {}) {
  const id = String(userId);
  return state.ledger
    .filter((t) => t.from === id || t.to === id)
    .slice(-limit)
    .reverse()
    .map((t) => ({ ...t }));
}

export function summarizeCurrency(state, userId = "local") {
  return `${getBalance(state, userId)} ${CURRENCY_CODE} · minted ${state.totalMinted} · burned ${state.totalBurned}`;
}
