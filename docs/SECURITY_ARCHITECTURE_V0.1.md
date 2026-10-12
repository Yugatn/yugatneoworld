# Information security architecture v0.1

## Principles (by design)

1. **Least privilege** — roles, sessions, ACL (school/admin already separate).
2. **Data minimization** — passport/INN never stored in plaintext (hashes only).
3. **Classification** — `public | internal | confidential | restricted`.
4. **Redaction** — logs and exports strip secrets/PII keys.
5. **Audit** — sensitive actions append to capped audit trail.
6. **Rate limits** — login, verifyPhone, vote, transfer, api.
7. **Sessions** — TTL 8h, idle 30m, revoke on demand / all devices.
8. **Fail closed** — verification and policy denials are explicit.
9. **Transport** — HTTPS/HSTS and CSP defined as `SECURITY_HEADERS` (server must set).
10. **Production checklist** — KMS, real crypto, WAF, no secrets in client.

## OWASP mapping

Full **OWASP Top 10:2021 → eWorld** matrix (status, modules, prod gaps):

→ **[`docs/OWASP_TOP10_MATRIX_V0.1.md`](./OWASP_TOP10_MATRIX_V0.1.md)**

## Module: `src/domain/security.js`

| Capability | API |
|------------|-----|
| Audit | `audit`, `listAudit` |
| Rate limit | `rateLimitAction`, `checkRateLimit` |
| Sessions | `createSession`, `touchSession`, `revokeSession` |
| Redact | `redactObject`, `sanitizeText` |
| Export | `secureExportWorldSlice` (no identity hashes) |
| Guards | `authorizeSensitiveAction`, `assertPolicy` |
| Headers | `SECURITY_HEADERS` |
| Ops | `PRODUCTION_CHECKLIST` |

## Threat → control (summary)

| Threat | Control |
|--------|---------|
| Credential stuffing | rate limit login |
| SMS / verify abuse | rate limit verifyPhone |
| XSS in UGC | `sanitizeText` + CSP |
| PII leak in logs | `redactObject` |
| Dump of identity | no plaintext; export omits hashes |
| Session theft | short TTL, idle timeout, revoke |
| Vote / money spam | rate limits + verification for official |
| MITM | TLS + HSTS (server) |
| Supply chain | npm audit in CI (checklist) |

## Limits of client-only model

Browser domain code **cannot** alone stop a determined attacker. Maximum practical security requires:

- Server-side authority for identity, currency, votes
- Real SHA-256/HMAC, hardware or cloud KMS
- HttpOnly cookies / rotating tokens
- Network edge protections

This module encodes the **contracts** so the product does not regress into storing secrets or logging PII as features grow.
