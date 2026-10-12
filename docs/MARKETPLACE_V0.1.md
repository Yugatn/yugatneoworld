# Marketplace v0.1 (Avito-style C2C)

Peer-to-peer classifieds inside eWorld — users sell their own goods.

## Flow

1. **Create listing** — title, description, category, condition, price (YC), city, settlement mode
2. **Search / browse** — query, category, max price, city
3. **Reserve** (optional) → **purchase with YC** or **meet** (offline deal)
4. **Withdraw** unsold ads

## Settlement modes

| Mode | Meaning |
|------|---------|
| `yc` | Pay with Yugatn Coin in-world |
| `meet` | Arrange in person / outside; no auto YC transfer |
| `either` | Buyer may pay YC or meet |

Platform fee on YC deals: **2%** (debited from seller after transfer).

## Categories

electronics · clothing · home · kids · hobby · transport · services · other

## Limits

- Max **30** active listings per seller
- Max price **50 000 YC**
- Text sanitized (`sanitizeText`)

## API

`createListing` · `updateListing` · `withdrawListing` · `searchListings` · `purchaseListing` · `reserveListing` · `markSoldMeet` · `seedDemoListings`

## World

- `WORLD_VERSION` **18**
- Object **Marketplace kiosk** in living room
- Portal / laptop: `marketplace.open` / `marketplace.sell`

## Voice

маркетплейс · авито · продать товар · купить с рук

*Not a fiat marketplace — YC is symbolic in-world currency.*
