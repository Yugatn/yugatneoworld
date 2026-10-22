# YUGATNEO Skills Verification — protocol v0.1
Status: cryptographic and domain primitives implemented; identity registry, storage, external employment registry integration and production enrollment NOT implemented.

## Workflow
1. Employee consents to verification of a specific employment record and skill; consent is revocable for future processing.
2. Verified employment record (electronic labor book where legally available, or employer HR record) proves the relationship and dates, not the skill itself. Never infer Excel/1C proficiency merely from job title.
3. Authorized HR, supervisor or director signs a specific skill claim after examining task evidence. Authority must be independently checked against a time-bounded company role registry, not self-declared.
4. Store only evidence hashes in public attestations; encrypted originals stay in controlled storage with retention rules. Protect commercial secrets and worker personal data.
5. Canonical record signed with Ed25519; verify signature using an independently enrolled, revocable issuer public key. Audit event chain must be append-only with external checkpoints and separate operator access.
6. Attestations may be disputed, revoked, or marked review_due. Historic verified experience remains in history; expired recency is not erasure.
7. Periodic review based on technology change and role. No automated downgrading of civic rights, employment access, or essential services.
8. Discounts and perks must be voluntary, proportional, funded transparently, not tied to private/sensitive characteristics, and never substitute for salary or labor rights.

## Threat model
Colluding manager and employee; forged authority; stolen signing key; fabricated employment; copied task artifacts; duplicate reviews; compromised administrators; replay; backdated records. Mitigations: government/HR cross-check where authorized, MFA and dual control for high-impact attestations, challenge-response signing, key rotation/revocation, evidence sampling, randomized audits, anomaly detection, independent appeals, external audit exports.

## Data model to implement
Organization, EmploymentRecord, AuthorizedIssuer (validFrom/validTo, publicKey, revokedAt), Skill, Evidence (private object pointer, hash, owner consent), Attestation, AttestationSignature, VerificationEvent, Dispute, AuditCheckpoint, BenefitProgram. Bind employeeId to authenticated identity, not to user-provided request fields.

## Integration boundaries
The existing `src/domain-ts/skill-verification.ts` validates structured records but its boolean verified fields are inputs from trusted services, NOT proof by themselves. `server/skill-crypto.js` provides signature primitives but does NOT enroll identities or keys. Do not expose a write API until secure authentication, issuer authorization, persistent storage, anti-replay and audit are built and independently tested.

## Fairness
New entrants and freelancers need alternative portfolio-based assessments; absence of employment records means unknown, not unskilled. Offer appeals, correction, accessible assessments and independent verification. No universal social score.
