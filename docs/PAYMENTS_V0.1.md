# Payments v0.1 → v0.27

In-world payments in **Yugatn Coin (YC)** only — not real money / not a PSP.

## Methods

| Method | Flow |
|--------|------|
| `yc_instant` | Buyer → seller immediately; optional platform fee from seller |
| `yc_escrow` | Buyer → **escrow** hold → `releaseEscrow` / `refundEscrow` / **auto-release** after TTL |

Default escrow TTL: **7 days** (`DEFAULT_ESCROW_TTL_MS`).

## API (`src/domain/payments.js`)

| Function | Purpose |
|----------|---------|
| `createPayment` | Create + capture (instant or hold) |
| `releaseEscrow` | Confirm receipt → seller |
| `refundEscrow` | Return funds to buyer |
| `autoReleaseExpired` | Cron/tick: release held past `releaseAfter` |
| `listOrders` / `getOrder` | Order history |
| `listReceipts` | Immutable-ish receipt snapshots |
| `rateSeller` | 1–5 stars after completed order |
| `getSellerRating` | Avg + count |

## Marketplace

```js
purchaseListing(mp, currency, payments, { listingId, buyerId, escrow })
confirmPurchase(...)
cancelPurchase(...)  // refund escrow, listing active again
```

Fee: **2%** on marketplace deals.

## Voice

оплата · мои заказы · эскроу · подтвердить получение

## World

`world.payments` · `WORLD_VERSION` ≥ 19
