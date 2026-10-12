# Crypto & P2P exchangers v0.1

In-world model for **crypto payment intents** and **P2P exchange offers**.

> **Not a licensed exchange.** No private keys, no on-chain broadcast, no real bank rails.
> Rates are **demo references**. On-chain settlement in production needs a separate compliant stack.

## Assets

USDT · BTC · ETH · TON

## P2P offers

| Side | Meaning |
|------|---------|
| `sell_yc` | Maker sells YC for crypto (YC locked in hold) |
| `buy_yc` | Maker buys YC, pays crypto off-band |

Flow: `createOffer` → `takeOffer` → `markCryptoSent` → `completeDeal`

## Exchanger registry

Stub partners: `local_desk`, `partner_board`, `community_otc`  
(`listExchangers`) — deep-link placeholders only.

## Crypto pay intent

Top up YC via crypto memo:

1. `createCryptoPayIntent` → amount + unique memo `EW-…`
2. `submitCryptoTx` (user pastes tx hint)
3. `confirmCryptoPayIntent` (system credits YC)

TTL: 30 minutes.

## API

`src/domain/crypto-p2p.js`

## Voice

крипта · p2p обмен · оплата usdt · обменник

## World

`WORLD_VERSION` **20** · object **P2P Crypto desk** · `world.cryptoP2p`
