# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Anonymous browser

Walk up to a **laptop** → private session → search the in-world knowledge index → tabs / new circuit / wipe on close.  
Sessions are not persisted. Docs: [`docs/ANON_BROWSER_V0.1.md`](docs/ANON_BROWSER_V0.1.md).

## Payments

YC escrow · crypto/P2P domain model · marketplace

## Security

- [OWASP Top 10 controls and checklist](docs/OWASP_TOP10_EWORLD.md)
- [Engineering review, residual risks, and next priorities](docs/ENGINEERING_REVIEW_2026-10-12.md)

**Prototype boundary:** local display profiles are not authenticated identities; realtime
state is in-memory; YC/crypto/P2P and marketplace documents describe domain models, not
live payment rails or production financial services.

## Run

```bash
npm install && npm start
npm test
```

## Status

v0.29.0 — anonymous browser at computers, world v21.

## Author

Югатн (Yugatn)
