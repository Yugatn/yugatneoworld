# Payments v0.1

In-world payments in **Yugatn Coin (YC)** only — not real money / not a PSP.

## Methods

| Method | Flow |
|--------|------|
| `yc_instant` | Buyer → seller immediately; optional platform fee from seller |
| `yc_escrow` | Buyer → **escrow** hold → `releaseEscrow` (to seller) or `refundEscrow` (to buyer) |

## API (`src/domain/payments.js`)

- `createPayment` — create order + capture
- `releaseEscrow` — confirm receipt / release to seller
- `refundEscrow` — return funds to buyer
- `listOrders` / `getOrder`
- `cancelOrder` — only if still `pending`

## Marketplace integration

```js
purchaseListing(mp, currency, payments, { listingId, buyerId, escrow: true|false })
confirmPurchase(mp, currency, payments, { listingId, buyerId })
cancelPurchase(mp, currency, payments, { listingId, actorId, reason })
```

- `preferEscrow` on listing → default escrow checkout
- Fee: **2%** (`PLATFORM_FEE_RATE`) on marketplace deals

## Voice

оплата · мои заказы · эскроу · подтвердить получение

## World

`WORLD_VERSION` **19** · `world.payments`
