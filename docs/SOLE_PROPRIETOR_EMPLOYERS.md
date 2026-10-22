# Индивидуальные предприниматели в СТСети

Employer records in the existing `organizations` collection now support `kind: "sole_proprietor"` alongside `kind: "legal_entity"`. Older records without kind are treated as legal entities for backward compatibility.

An IP record requires a registration identifier in the internal snapshot. This is **format validation only**, not confirmation of registration or identity. Country-specific registries and jurisdictional identifiers must be implemented separately. Do not expose unnecessary personal registration details in the public vacancy API.

The `sole_proprietor_owner` role may manage only its own verified IP vacancies. A legal entity cannot use this role. Other existing organization roles remain supported.

Future enrollment must verify business status with authorized sources, verify ownership and delegate permissions, record revocations, and provide appeal and audit. Do not publish an unauthenticated employer write endpoint.
