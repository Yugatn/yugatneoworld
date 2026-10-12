# Currency · Identity · Voting v0.1

## Internal currency — Yugatn Coin (YC)

- Code: **YC** · not real money
- `ensureWallet` / `credit` / `debit` / `transfer` / ledger
- Default opening balance: **100 YC**
- Used later for shops, cinema, transfers between users

## Identity verification (privacy-first)

1. **Consent** required for any personal data step  
2. **Phone** → SMS check (stub) → masked display, **hash only** stored  
3. **Passport + INN** linked to that phone → **hashes only**, uniqueness indexes  

Plain passport/INN are **never** kept in world state.

Levels: `none` → `phone` → `full`

Duplicate phone / passport / INN across accounts is rejected.

Production should replace `hashIdentityValue` with server-side SHA-256 + salt and a real eID/SMS provider.

## Voting

| type | verification |
|------|----------------|
| community | optional |
| school | optional |
| **official** | **full** (phone + passport + INN) |

- `createPoll` · `castVote` · `closePoll` · `getPollResults`
- One vote per user; can change until closed

## Voice

голосование · верификация · баланс
