# Shared furniture sync v0.1

## Behaviour

- Placing furniture while connected to a multiplayer room broadcasts `furniture.place`.
- Picking up furniture broadcasts `furniture.remove`.
- `room.snapshot` includes the current furniture list for the room.
- Remote objects appear for other peers; local inventory is only adjusted for the actor who placed/picked.
- Room furniture is ephemeral: cleared when the last peer leaves the room.

## Limits

- Max 40 objects per room.
- No ownership lock beyond `ownerId` tag (anyone can pick for now).
- No durable server-side persistence of furniture across empty rooms.

## Protocol

| Type | Direction | Payload |
|------|-----------|---------|
| furniture.place | client → server | object fields + id |
| furniture.placed | server → room | sanitized object |
| furniture.remove | client → server | `{ id }` |
| furniture.removed | server → room | `{ id, by }` |
