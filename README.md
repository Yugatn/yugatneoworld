# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Security

- Domain security layer: sessions, audit, rate limits, redaction, CSP policy headers.
- **HTTP server applies `SECURITY_HEADERS`** (CSP, nosniff, frame-deny, Referrer-Policy; HSTS in `NODE_ENV=production`).
- Identity: phone + passport/INN verification stores **hashes only**.
- Liveness: `GET /healthz`
- **OWASP Top 10 for eWorld** → [`docs/OWASP_TOP10_EWORLD.md`](docs/OWASP_TOP10_EWORLD.md)
- Matrix → [`docs/OWASP_TOP10_MATRIX_V0.1.md`](docs/OWASP_TOP10_MATRIX_V0.1.md)
- Architecture → [`docs/SECURITY_ARCHITECTURE_V0.1.md`](docs/SECURITY_ARCHITECTURE_V0.1.md)

## Features (domain)

Avatar shop · travel · cinema · podcasts · wellness/health · school/ACL · voting · YC currency · voice commands (RU/EN).

## Run

```bash
npm install && npm start
# production-style headers:
NODE_ENV=production npm start
npm test
```

Open `http://localhost:8080` · health `http://localhost:8080/healthz`

## Status

v0.24.0 — server security headers, healthz, chat sanitize, WS connect budget, CI audit step.

## Author

Югатн (Yugatn)
