# Labor administration v0.1

The `applyLaborCommand` pure function implements draft creation, editing, opening and closing vacancies for an **already verified** employer. A caller supplies an actor with an organization-scoped role. This is a *policy engine*, not an authentication system.

Security:
- No public write HTTP endpoints exist.
- Never accept actor identity or `active` status from a browser request. Resolve the actor from authenticated, server-side session and an independently verified organization membership registry.
- `verified` employer status is a trusted operator assertion until official organization validation is integrated.
- Commands are pure and return a new snapshot plus an event descriptor. Production persistence needs transactional compare-and-swap, server-side event logging, idempotency keys, and concurrency tests.
- Creating a vacancy defaults to draft, never automatically publishes.
- Recruiters cannot mutate vacancies belonging to another organization.
- This module cannot safely be exposed over the network until authentication, CSRF defenses, rate limiting, audit storage and persistence transactions are implemented.

Next: verified organization enrollment, RBAC identity storage, durable audit trail and administrative UI.
