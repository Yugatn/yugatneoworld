# OWASP Top 10:2021 → Yugatn eWorld matrix

Reference: [OWASP Top 10:2021](https://owasp.org/Top10/2021/).  
**Full standard (per-risk requirements):** [`docs/OWASP_TOP10_EWORLD.md`](./OWASP_TOP10_EWORLD.md)  
Companion: `docs/SECURITY_ARCHITECTURE_V0.1.md`, module `src/domain/security.js`.

**Status legend**

| Status | Meaning |
|--------|---------|
| **Done (domain)** | Contract / control exists in domain modules |
| **Partial** | Domain ready; server/UI enforcement still required |
| **Todo (prod)** | Must be implemented outside pure client domain |

---

## Matrix

| ID | OWASP risk | eWorld controls (code / docs) | Status | Production gap |
|----|------------|-------------------------------|--------|----------------|
| **A01** | Broken Access Control | `access-control.js` roles (student/teacher/admin); `authorizeSensitiveAction`; voting requires full verify for `official`; fail-closed `assertPolicy` | Partial | Enforce every capability on **server**; deny-by-default API; IDOR tests |
| **A02** | Cryptographic Failures | Identity: passport/INN **hashed only** (`identity-verify.js`); no plaintext PII in state; `PRODUCTION_CHECKLIST` (TLS, KMS) | Partial | Server SHA-256 + per-user salt; TLS 1.2+; encrypt restricted fields at rest |
| **A03** | Injection (incl. XSS) | `sanitizeText`; CSP in `SECURITY_HEADERS`; bulletin/embeds; **server `sanitizeChatText`** | Partial | Contextual encoding in UI; parameterized DB queries; never `eval` user content |
| **A04** | Insecure Design | Security-by-design: data classes, minimization, consent gates (wellness/identity), official vote ≠ community vote | Done (domain) | Threat model per feature; ASVS L2 backlog |
| **A05** | Security Misconfiguration | `SECURITY_HEADERS` applied in **`server/index.js`**; path traversal guard; method allowlist; `/healthz` | Partial | TLS terminator; no directory listing on reverse proxy; secrets only via env |
| **A06** | Vulnerable and Outdated Components | CI `npm audit --audit-level=high` (advisory) | Partial | CI hard-fail on critical; Dependabot; lockfile |
| **A07** | Identification and Authentication Failures | Sessions: TTL 8h, idle 30m, revoke; rate limits; **WS connect budget per IP** | Partial | HttpOnly Secure SameSite cookies or rotating bearer; MFA for privileged roles |
| **A08** | Software and Data Integrity Failures | — | Todo (prod) | Signed releases; integrity of WS payloads; protect CI secrets; lockfile |
| **A09** | Security Logging and Monitoring Failures | `audit` + `listAudit`; auto-`redactObject` on details; capped trail | Partial | Immutable append-only sink; alerts on `rate_limit.hit` / `auth.fail` / `policy.deny` |
| **A10** | Server-Side Request Forgery (SSRF) | No server-side arbitrary URL fetch in domain; embed allowlist mindset (YouTube/Google docs hosts in CSP `frame-src`) | Partial | If server fetches URLs: allowlist only; block link-local / metadata IPs |

---

## Module ownership

| Control area | Primary modules |
|--------------|-----------------|
| Access / roles | `access-control.js`, `school-mode.js`, `voting.js`, `security.js` |
| Identity / PII | `identity-verify.js`, `security.js` (redact/export) |
| Sessions / rate limit | `security.js`, `server/index.js` (connect budget) |
| Currency integrity | `currency.js` + server authority (prod) |
| Input hygiene | `security.js`, `bulletin-board.js`, `embeds.js`, server chat sanitize |
| Headers / transport | `SECURITY_HEADERS` → **`server/index.js`** |

---

## Priority backlog (prod)

1. **A01 + A07** — server-side session + ACL on all mutating APIs  
2. **A02** — real crypto + TLS  
3. **A09** — ship audit to durable store + monitoring  
4. **A06 / A08** — CI hard-fail + supply-chain controls  
5. **A03 / A10** — harden UI encoding and any future server fetchers  

---

## Related standards

- **Full eWorld OWASP standard** — `docs/OWASP_TOP10_EWORLD.md`
- **ASVS 5.0** — verification requirements (target **L2** for identity, health, voting, currency).  
- **Cheat Sheet Series** — Session, Access Control, XSS, CSP, WebSocket, Cryptographic Storage.  
- Internal: `docs/SECURITY_ARCHITECTURE_V0.1.md`, `docs/CURRENCY_IDENTITY_VOTING_V0.1.md`.

*Client domain contracts reduce design debt; they do not replace server enforcement.*
