# Avatar shop · Travel · Cinema invites v0.1

## Philosophy: affordable first

- Everyday avatar clothes: **2–6 YC** (Yugatn Credits).
- NFT mint: **~18–25 YC**, limited supply — prestige, not a paywall.
- Second-hand: list below retail; circulate items instead of forcing new buys.
- Real fashion markets: deep-links only; eWorld does not markup real garments.

## Avatar shop (`src/domain/avatar-shop.js`)

- `listShopCatalog({ kind, slot, maxPrice })`
- `buyStandard(shop, avatar, catalogId)` → wardrobe
- `mintNft(shop, catalogId, ownerId)` → unique token
- `listSecondHand` / `buySecondHand` — secondary market
- `listRealFashionMarkets` / `openRealMarket` — partner URLs for real clothes

Objects: bedroom **Clothing shop tablet**, wardrobe, city portal.

## Travel (`src/domain/travel-tickets.js`)

- Search **air** and **rail** sample routes (modest EUR fares).
- `draftTicket` → `confirmTicket`
- Laptop / city portal: `travel.tickets`

Real GDS/payment not in v0.1.

## Cinema invites (`src/domain/cinema.js`)

- `purchaseScreening(buyerId)` — buy film at low fixed price
- `inviteFriendsToWatch(hostId, friendIds)`
- `respondToCinemaInvite(userId, accept)`
- TV / sofa: `cinema.invite` · `cinema.watch`

## Voice

- магазин одежды / clothing shop
- секонд хенд / second hand
- авиабилеты / билеты на поезд
- пригласить в кино
