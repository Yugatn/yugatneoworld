# OWASP Top 10 for Yugatn eWorld

**Project standard** based on [OWASP Top 10:2021](https://owasp.org/Top10/2021/).  
Version: **0.1** · Applies to: web client, domain modules, WebSocket server, future API.

Related docs:
- `docs/OWASP_TOP10_MATRIX_V0.1.md` — compact status matrix
- `docs/SECURITY_ARCHITECTURE_V0.1.md` — architecture principles
- `src/domain/security.js` — domain controls

---

## How to use this document

1. **Before a feature** — check which Top 10 items it touches.
2. **In code review** — reject merges that weaken a listed control.
3. **Before production** — close all **Todo (prod)** items for the release scope.
4. **Target verification depth** — ASVS **L2** for identity, voting, currency, health.

**Status values:** Done (domain) · Partial · Todo (prod)

---

## A01:2021 — Broken Access Control

### Risk in eWorld
Unauthorized access to another user’s apartment state, school admin actions, official votes, currency transfers, health data, or identity verification status.

### Examples
- Student calls teacher-only schedule edit API.
- User votes in `official` poll without full identity verification.
- WebSocket message changes another subject’s balance.

### Controls in eWorld
| Control | Location |
|---------|----------|
| Roles student / teacher / admin | `access-control.js`, `school-mode.js` |
| Official poll requires full verification | `voting.js` + `identity-verify.js` |
| `authorizeSensitiveAction`, `assertPolicy` | `security.js` |
| Fail closed on policy deny | `security.js` |

### Requirements
- [ ] Every mutating server endpoint checks session + role + resource ownership.
- [ ] Deny by default; explicit allow lists only.
- [ ] IDOR tests for currency, votes, bulletin, health.
- [ ] Capabilities on world objects are **hints for UI**, not authority.

**Status:** Partial

---

## A02:2021 — Cryptographic Failures

### Risk in eWorld
Exposure of passport, INN, phone, session tokens, or currency ledger through weak storage or cleartext transport.

### Controls in eWorld
| Control | Location |
|---------|----------|
| Passport / INN never stored as plaintext — hashes only | `identity-verify.js` |
| Masked phone only in profiles | `identity-verify.js` |
| Export strips identity hashes | `secureExportWorldSlice` |
| TLS / KMS listed in checklist | `PRODUCTION_CHECKLIST` |

### Requirements
- [ ] HTTPS only in production (HSTS).
- [ ] Server-side SHA-256 (or stronger) + unique salt for identity material.
- [ ] Restricted fields encrypted at rest (KMS).
- [ ] No secrets in client bundle or git.
- [ ] Replace demo `hashIdentityValue` before any real PII processing.

**Status:** Partial

---

## A03:2021 — Injection

### Risk in eWorld
XSS via bulletin, announcements, chat, display names; command/query injection if a database is added; malicious embed URLs.

### Controls in eWorld
| Control | Location |
|---------|----------|
| `sanitizeText` | `security.js` |
| CSP (`default-src 'self'`, limited `frame-src`) | `SECURITY_HEADERS` |
| Embed host constraints | `embeds.js` + CSP |

### Requirements
- [ ] Encode all user-generated content for the output context (HTML/attr/JS).
- [ ] Never `innerHTML` unsanitized strings; prefer text nodes / safe templates.
- [ ] Parameterized queries only if SQL/NoSQL is introduced.
- [ ] Validate and allowlist embed origins (YouTube, Google Docs/Sheets/Slides).

**Status:** Partial

---

## A04:2021 — Insecure Design

### Risk in eWorld
Missing threat model for civic voting, PII, health, or money leads to features that cannot be fixed by “better code” alone.

### Controls in eWorld
| Control | Location |
|---------|----------|
| Data classification public → restricted | `security.js` `DATA_CLASS` |
| Consent gates (identity, wellness) | `identity-verify.js`, `wellness.js` |
| Official vs community polls | `voting.js` |
| Affordable / non-fiat currency design | `currency.js` |

### Requirements
- [ ] Threat model note for each module that handles PII, money, or votes.
- [ ] Prefer minimization: do not collect data that is not required.
- [ ] Security review when adding roles or new room capabilities.

**Status:** Done (domain) — keep maintaining

---

## A05:2021 — Security Misconfiguration

### Risk in eWorld
Missing security headers, open admin paths, verbose errors, default credentials, exposed stack traces.

### Controls in eWorld
| Control | Location |
|---------|----------|
| Recommended headers (HSTS, CSP, nosniff, frame-deny) | `SECURITY_HEADERS` |

### Requirements
- [ ] Apply `SECURITY_HEADERS` in `server/` on all responses.
- [ ] No directory listing; no default admin passwords.
- [ ] Separate dev/prod configs; debug off in production.
- [ ] WebSocket origin checks.

**Status:** Todo (prod)

---

## A06:2021 — Vulnerable and Outdated Components

### Risk in eWorld
Compromised or vulnerable `ws` / transitive npm packages.

### Controls in eWorld
| Control | Location |
|---------|----------|
| `npm audit` in production checklist | `PRODUCTION_CHECKLIST` |

### Requirements
- [ ] CI fails on high/critical advisories.
- [ ] Dependabot or Renovate enabled.
- [ ] Commit and use lockfile.
- [ ] Review new dependencies before merge.

**Status:** Todo (prod)

---

## A07:2021 — Identification and Authentication Failures

### Risk in eWorld
Session fixation/theft, credential stuffing on login/SMS verify, weak binding of phone → passport → INN.

### Controls in eWorld
| Control | Location |
|---------|----------|
| Session TTL 8h, idle 30m | `security.js` |
| `createSession` / `touchSession` / `revokeSession` / `revokeAllSessions` | `security.js` |
| Rate limits: login, verifyPhone | `RATE_LIMITS` |
| Unique phone / passport / INN indexes | `identity-verify.js` |

### Requirements
- [ ] Server-side sessions; HttpOnly + Secure + SameSite cookies (or rotating bearer).
- [ ] Rate limit at edge and app.
- [ ] MFA for admin / teacher privilege elevation.
- [ ] Invalidate sessions on password/identity change.

**Status:** Partial

---

## A08:2021 — Software and Data Integrity Failures

### Risk in eWorld
Tampered client updates, poisoned CI, altered WebSocket payloads, unsigned releases.

### Controls in eWorld
None mandatory yet in domain (integrity fingerprint helper is non-cryptographic).

### Requirements
- [ ] Protect CI secrets; signed artifacts where applicable.
- [ ] Verify integrity of critical WS messages (HMAC) for currency/votes.
- [ ] No auto-exec of untrusted serialized objects.
- [ ] Lockfile + reproducible builds.

**Status:** Todo (prod)

---

## A09:2021 — Security Logging and Monitoring Failures

### Risk in eWorld
Attacks go unnoticed; logs contain PII; audit can be wiped on client.

### Controls in eWorld
| Control | Location |
|---------|----------|
| `audit` / `listAudit` | `security.js` |
| Auto-redaction of sensitive keys | `redactObject` |
| Events: session, rate_limit, identity, vote, transfer, policy.deny | `SECURITY_EVENTS` |

### Requirements
- [ ] Persist audit server-side (append-only).
- [ ] Alert on repeated `auth.fail`, `rate_limit.hit`, `policy.deny`.
- [ ] Never log raw passport, INN, SMS codes, tokens.
- [ ] Time sync and retention policy.

**Status:** Partial

---

## A10:2021 — Server-Side Request Forgery (SSRF)

### Risk in eWorld
If the server fetches user-supplied URLs (previews, webhooks, embeds), attacker reaches internal network or cloud metadata.

### Controls in eWorld
| Control | Location |
|---------|----------|
| No arbitrary server-side URL fetch in domain | — |
| CSP `frame-src` limited to known embed hosts | `SECURITY_HEADERS` |

### Requirements
- [ ] Allowlist schemes and hosts for any server-side HTTP client.
- [ ] Block RFC1918, link-local, metadata IPs (e.g. 169.254.169.254).
- [ ] Prefer client-side embed iframes with CSP over server proxying.

**Status:** Partial

---

## eWorld-specific priorities

| Priority | Items | Why |
|----------|-------|-----|
| P0 | A01, A07, A02 | Roles, sessions, PII/crypto for voting & identity |
| P1 | A05, A09 | Headers + real audit before public beta |
| P2 | A03, A06, A08 | XSS hardening + supply chain |
| P3 | A10, A04 maintain | SSRF when fetchers appear; keep secure design |

---

## Acceptance for a “secure enough” production cut

- [ ] All P0 requirements checked
- [ ] `SECURITY_HEADERS` active on HTTP responses
- [ ] Identity and currency mutations only on server with session ACL
- [ ] Official voting path tested: unverified user rejected
- [ ] Audit events visible in ops tooling without PII leakage
- [ ] `npm audit` clean of high/critical (or risk-accepted in writing)

---

## References

- OWASP Top 10:2021 — https://owasp.org/Top10/2021/
- OWASP ASVS 5.0 — https://owasp.org/www-project-application-security-verification-standard/
- OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org/
- Internal matrix — `docs/OWASP_TOP10_MATRIX_V0.1.md`

*This file is the project’s OWASP Top 10 standard for Yugatn eWorld. Update status and checkboxes when controls move from domain stubs to production enforcement.*
