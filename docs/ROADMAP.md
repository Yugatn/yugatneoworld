# Roadmap — Yugatn eWorld

## Done (domain / vertical slices)

- Spatial apartment, rooms, smart home, avatar, commerce, school mode, ACL, bulletin, embeds
- Avatar shop / NFT / second-hand, travel drafts, cinema invites, podcasts
- Wellness + health, currency (YC), identity verify, voting
- Security domain: sessions, audit, rate limits, redaction, OWASP Top 10 docs
- **Server hardening v0.24:** security headers (CSP/HSTS policy), `/healthz`, chat sanitize, WS connect budget

## Milestone — Production infrastructure (next)

1. Server-side authority for identity, YC, official votes (A01/A02/A07)
2. Persistent audit sink + alerts (A09)
3. Real SHA-256 identity hashing + TLS termination
4. CI hard-fail on critical `npm audit` (A06)
5. Canvas UI parity for health/wellness/avatar effects
6. Moderation tools for bulletin/chat

## Milestone — Shared world

Public areas, discovery, events, partner markets live integration.

## Engineering rule

Domain modules first; no separate apps; keep tests green; security contracts before feature chrome.
