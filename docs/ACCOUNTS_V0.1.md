# Accounts Vertical Slice v0.1

## Scope

Local account layer only. No server authentication, OAuth, or password recovery.

## Model

- **Guest** — ephemeral session (`guest-local`), not listed in the accounts registry.
- **Account** — named local identity with stable `subjectId` (`u_…`), stored in `localStorage`.
- Multiple accounts can exist on one device; only one session is active.

## Storage keys

| Key | Purpose |
|-----|---------|
| `eworld.accounts.v1` | Registry of named accounts |
| `eworld.session.v1` | Active session |
| Legacy `eworld.identity` / `yugatn-eworld-profile-v1` | Migrated once on load |

## UI

- **Account** button in the HUD opens the account panel.
- Create account (display name) → signs in and updates multiplayer profile.
- Switch between saved accounts.
- Continue as Guest / Sign out.
- Delete account removes it from the local registry.

## Multiplayer

Session `displayName` and `avatar` are pushed to the realtime profile on join and on profile update. `subjectId` is kept local for now (server still identifies peers by connection id).

## Not in v0.1

- Server-side auth / tokens
- PIN or password
- Cross-device sync
- Friends list UI (domain stubs exist in `social.js`)
