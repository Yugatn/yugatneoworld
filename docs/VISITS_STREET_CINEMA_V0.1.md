# Visits, Friend Streets & Shared Cinema v0.1

## Apartment door

- **Open** (`doorOpen: true`): friends on the street can request a visit.
- **Closed**: visit requests are denied by the server.
- Toggle via room capabilities (**E** in empty space) → Open/Close door.
- State is broadcast as `apartment.door` and shown in the multiplayer player list (🔓/🔒).

## Friends

- In the Multiplayer panel, use **Friend** next to a player to add them to local contacts.
- Friend count selects the **street tier**:

| Friends | Street | Features |
|--------:|--------|----------|
| 0 | Quiet lane | services |
| 1–2 | Neighbors street | + visits |
| 3–5 | Friends avenue | + cinema |
| 6+ | Social boulevard | + premiere |

## Street visits

- Enter the city via **City & Work** portal.
- Open friend doors appear on the street when the friend has `doorOpen` and is in contacts.
- Approaching an open door → **Visit**.
- Server checks the host door; if closed → `visit.denied`.

## Shared cinema

- Unlocked from Friends avenue (3+ friends).
- Players contribute **symbolic credits** toward a pool (target 6–10 depending on film).
- **Co-watch advantage**: with friends, contribution is 1 credit instead of 2.
- When the pool reaches the target, the screening activates for the room.
- Local credits start at 20 (`eworld.social.v1`).

## Not in v0.1

- Real payment / tickets
- Video streaming of actual films (UI + pool only)
- Cross-room cinema lobby
