# Labor store prototype v0.1

The repository now includes a JSON file-backed labor snapshot store with validation, referential integrity, atomic file replacement and a read-only public vacancy projection.

## Trust boundary
- Organizations marked `verified` are **only as trustworthy as the operator that supplied the snapshot**. The store does not perform registry checks, identity verification or grant authorization.
- There is deliberately **no public write endpoint**. Do not accept anonymous requests to change employer verification status.
- Public vacancy search excludes unverified/suspended employers and draft/closed vacancies.
- `saveLaborStore` is intended for a single-process administrative importer, not concurrent public edits. Atomic rename does not provide transactional concurrency control or durability guarantees across crashes.
- No applicant data, employment records, identity documents or signing keys should be stored in this JSON snapshot.
- Production path: PostgreSQL migrations, authenticated RBAC administrative API, audit events, external organization verification, rate limiting, backups and privacy review.

## Configuration
Set `LABOR_STORE_PATH` to an operator-controlled JSON file path to enable persisted vacancy discovery. With the variable unset, the existing read-only demonstration dataset is used. Missing configured file yields an empty verified vacancy list rather than fictional production vacancies.

## Next
Secure employer enrollment, real job publishing, application workflow, privacy controls, 2D office links and external verification.
