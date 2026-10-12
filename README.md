# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Security

- Domain security layer: sessions, audit, rate limits, redaction, CSP policy headers.
- Identity: phone + passport/INN verification stores **hashes only**.
- **OWASP Top 10:2021 matrix** → [`docs/OWASP_TOP10_MATRIX_V0.1.md`](docs/OWASP_TOP10_MATRIX_V0.1.md)
- Architecture → [`docs/SECURITY_ARCHITECTURE_V0.1.md`](docs/SECURITY_ARCHITECTURE_V0.1.md)

## Avatar shop · NFT · second-hand

- **Affordable** standard clothes; optional NFT; second-hand; real fashion market links.
- See `docs/SHOP_TRAVEL_CINEMA_V0.1.md`.

## Travel · cinema · podcasts · wellness · health

Air/rail drafts, cinema invites, podcast live, fitness/yoga (consent-gated avatar), health/illness, doctor booking.

## School · access · bulletin · voting · currency

Roles, ACL, embeds, announcements, official voting (full verification), Yugatn Coin (YC).

## Run

```bash
npm install && npm start
npm test
```

## Status

v0.23.0 — security architecture, OWASP matrix, currency, identity, voting, health, wellness, podcasts.

## Author

Югатн (Yugatn)
