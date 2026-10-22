# СТСеть × YUGATNEO MATRIX — progress baseline

Baseline 2026-10-23. **Estimated completion: 27%**. This is a planning estimate, not deployment verification.

| Workstream | Weight | Completion | Contribution |
|---|---:|---:|---:|
| Architecture and requirements | 10% | 75% | 7.5% |
| Existing 2D social world integration | 15% | 40% | 6% |
| Labor portal and vacancies | 20% | 45% | 9% |
| Skill verification and authority/audit primitives | 20% | 15% | 3% |
| Reputation, disputes and fairness | 15% | 3% | 0.45% |
| Persistence, identity and production security | 15% | 7% | 1.05% |
| Pilot, accessibility and deployment | 5% | 0% | 0% |
| **Total** | **100%** | | **27% (rounded from 27.0%)** |

Scoring method: weighted sum of independently assessed feature completion. No percentage increase merely for commits. Next milestones: persistent data, authenticated issuer enrollment, external employment verification, dispute workflow, real vacancy publishing, 2D office integration, full CI and pilot.

## Update 2026-10-23
Added a validated JSON snapshot persistence prototype and wired optional read-only discovery through LABOR_STORE_PATH. This is NOT a production database, authenticated publishing workflow, or employer identity verification. The snapshot must be stored outside the web-served repository root. Automated tests are committed but execution is not verified in this session.

## Update: organization-scoped vacancy commands
Added draft/create/edit/open/close policy with organization scoping, verified-employer prerequisite, explicit tests and documentation. This is not an authenticated publishing API. Test execution not verified in this session.

## Update: sole proprietor support
Added optional employer kind, sole proprietor registration identifier format checks, owner role and authorization policy, public employer-kind projection and regression tests. External registration and identity checks are not implemented. Tests committed but not executed in this session.
