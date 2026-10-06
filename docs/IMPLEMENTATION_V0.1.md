# Yugatn eWorld — Implementation v0.1

## Goal

Create the first playable vertical slice before introducing the production backend.

## Client stack

The initial client should be kept renderer-agnostic. The domain layer must not depend on a specific rendering library.

### Domain modules

```text
src/domain/
  world
  avatar
  apartment
  objects
  interaction
  inventory
  media
  social
  messaging
  permissions
  sync
```

### Rendering modules

```text
src/render/
  scene
  sprites
  camera
  input
  animation
```

### Integration modules

```text
src/integration/
  symbiont
  eugene
  event-bus
```

## Vertical slice

### Scene

One apartment with:

- one room;
- avatar spawn point;
- mailbox;
- laptop;
- television;
- music player;
- door;
- several decorative objects.

### Movement

The avatar moves continuously on a 2D plane and cannot cross room boundaries or solid furniture.

### Interaction

When the avatar enters an object's interaction radius, the object becomes active. The player can interact using the primary input. A contextual panel opens only for the selected capability.

### Persistence

Save:

- avatar position;
- avatar appearance;
- room layout;
- object positions;
- inventory.

Do not persist transient UI state as world state.

## Integration adapters

Define interfaces before concrete network implementations:

```text
EugeneMessengerAdapter
  listConversations()
  getConversation(id)
  composeMessage(target)
  sendMessage(draft)

SymbiontEventAdapter
  publish(event)
  subscribe(filter)
  requestCapability(capability)
  getIdentityAnchor()
```

These are interface contracts, not claims that the external services currently expose these exact APIs.

## Event flow

```text
User approaches mailbox
        ↓
Local interaction
        ↓
Capability request
        ↓
SymbiontOS policy boundary
        ↓
Eugene adapter
        ↓
Message capability
        ↓
Result event
        ↓
World/UI update
```

## First acceptance test

A prototype is successful when a user can:

1. enter the apartment;
2. move the avatar;
3. approach the mailbox;
4. activate it;
5. open a message view;
6. return to the apartment without losing position.

The same interaction pattern must work for laptop and television.

## Next implementation stage

After the vertical slice works:

- add multi-room apartment;
- add furniture editor;
- add inventory;
- add avatar wardrobe;
- add local social graph;
- add Eugene adapter against a verified API contract;
- add SymbiontOS event transport against a verified contract;
- add real-time visitor synchronization.

## Non-goals for v0.1

- full backend;
- public-world networking;
- autonomous agents;
- real-money economy;
- irreversible account actions;
- invented external API endpoints.
