# Temporary apartment keys v0.1

## Idea

Host can give another player a **temporary key** to their apartment.
While the key is valid, the guest may:

- **visit** even if the door is closed to the street / public
- use **media** (TV, shared cinema pool, music player UI)
- play **games** in the apartment (hook for future game objects)

## Durations

- 1 hour
- 6 hours
- 24 hours

## Protocol

| Message | Direction | Purpose |
|---------|-----------|---------|
| `key.grant` | client → server | `{ targetId, durationHours, permissions }` |
| `key.granted` | server → host & guest | `{ key, role: "host"| "guest" }` |
| `key.revoke` | host → server | `{ keyId }` |
| `key.revoked` | server → host & guest | `{ keyId, ... }` |
| `key.list` | client → server | returns granted + received |
| `visit.request` | guest → server | allowed if `doorOpen` **or** valid key |

Key payload: `id, hostId, guestId, hostName, guestName, permissions[], grantedAt, expiresAt`.

## UI

Multiplayer player list → **Key** → choose duration.
Toast on grant / receive / revoke.
Visit with key shows `viaKey: true`.

## Not in v0.1

- Persistent keys after server restart
- Cross-room key (must share room or re-join host room)
- Granular revoke of single permission
- Real media streaming / game sessions
