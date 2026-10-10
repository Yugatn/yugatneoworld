# Furniture vertical slice v0.1

## Goal

Smallest usable apartment customization: place and pick furniture from inventory without a full editor.

## Model

- `inventory[]` on world state: owned catalog item ids
- Placed instances live in `world.objects` with `movable: true` and `inventoryItemId`
- Design-space coordinates (layout.js DESIGN 1000×560), scaled to canvas at draw time

## API (`src/domain/inventory.js`)

- `placeFurniture(world, inventory, itemId, roomId, x, y)`
- `pickFurniture(world, inventory, objectId)`
- `listPlaceable(inventory)` / `FURNITURE_CATALOG`

## UX

1. **E** with no nearby object → room capabilities includes Inventory
2. Choose item → placed ~50px right of avatar in current room
3. Approach placed item → **furniture.pick** returns it to inventory

## Persistence

World version 4. Movable objects survive version migration when possible.

## Out of scope

- Drag-to-move, rotate, snap grid
- Multiplayer replication of furniture
- Shop / purchase flow
