# Yugatn eWorld

A social network designed as a navigable 2D world rather than a conventional profile-and-menu application.

## Core idea

A user's profile is a **personal apartment** in a shared 2D social world.

The user controls an avatar that can move through rooms and interact with objects. Communication and media actions are represented by objects in the world instead of being reduced to menu buttons.

Examples:

- 📮 mailbox — receive/send messages;
- 💻 laptop — messages, feeds, browsing and social tools;
- 📺 television — watch video;
- 🎵 music player — listen to music;
- 🖼️ wall/art — personal media and identity;
- 🛋️ furniture — configurable environment;
- 🚪 door — navigation between rooms/world locations;
- 👥 social objects — friends and visitors;
- 🛍️ shop/catalog — acquire and replace objects;
- 👕 wardrobe — avatar clothing and appearance.

## Design principles

### 1. World before menu

The primary interface is spatial interaction. Menus may exist as secondary accessibility and utility layers, but the core experience should remain object-driven.

### 2. Avatar as an agent in space

The avatar can move inside rooms and interact with objects. Position, proximity and interaction state are first-class UI concepts.

### 3. Apartment as profile

Instead of a static profile page, each user has a customizable apartment that communicates identity through:

- furniture;
- objects;
- media;
- clothing;
- room layout;
- collections;
- decorations;
- social presence.

### 4. Objects are functional

An object is not merely decoration. It can expose an interaction capability.

`Object → Interaction → Capability → Result`

Examples: mailbox → message composer; laptop → social workspace; television → video player.

### 5. Persistent customization

Furniture, objects, room layout and avatar appearance are persistent user state. Items can be added, removed, replaced, moved and upgraded.

### 6. Social presence

Friends may visit apartments and appear as avatars. Presence should be represented spatially where technically and privacy-wise appropriate.

## Initial architecture

```text
World
 ├── Public spaces
 ├── Social spaces
 └── Private apartments
      ├── Rooms
      ├── Objects
      ├── Media surfaces
      └── Avatar

Avatar
 ├── appearance
 ├── wardrobe
 ├── position
 ├── animation state
 └── interaction state

Object
 ├── type
 ├── position
 ├── appearance
 ├── inventory item
 └── interaction capability

Social layer
 ├── identity
 ├── friends
 ├── visitors
 ├── messages
 └── presence

Media layer
 ├── video
 ├── audio
 ├── images
 └── user collections
```

## MVP

The first implementation should establish the spatial interaction loop before building the full social platform:

1. 2D world renderer;
2. one apartment with multiple rooms;
3. movable avatar;
4. collision/proximity interaction;
5. interactive mailbox;
6. interactive laptop;
7. interactive television;
8. music player;
9. basic friend/visitor representation;
10. furniture placement and persistence;
11. avatar clothing/appearance;
12. save/load world state.

## Interaction model

The MVP should support both keyboard and pointer/touch interaction.

An interaction is selected by the avatar's spatial relationship to an object, not only by a permanent button.

A secondary interaction panel may appear after the user approaches an object.

## Data model

Core entities:

- `User`
- `Avatar`
- `Apartment`
- `Room`
- `WorldObject`
- `InventoryItem`
- `MediaItem`
- `Friendship`
- `Message`
- `Visit`
- `WardrobeItem`
- `WorldState`

## Security and privacy

Private apartments are private by default.

Visitor permissions must be explicit and revocable.

Media and messages retain their own access controls.

The world renderer must never imply that a visitor has access merely because an avatar is visible.

## Development roadmap

### Phase 1 — Spatial prototype

Build the apartment, avatar movement and object interaction.

### Phase 2 — Personalization

Add inventory, furniture, room editing and avatar wardrobe.

### Phase 3 — Social layer

Add profiles-as-apartments, friends, visits and messaging.

### Phase 4 — Media layer

Add video, music, images and personal collections.

### Phase 5 — Shared world

Add public spaces, discovery, events and social navigation.

### Phase 6 — Persistence and infrastructure

Add accounts, synchronization, moderation, privacy controls, backups and scalable real-time presence.

## Product direction

Yugatn eWorld should feel closer to **living inside a social world** than opening a conventional social-network dashboard.

The interface is the environment itself.

## Status

**Project initialized — architecture and MVP specification.**

Implementation should proceed incrementally, validating the spatial interaction loop before adding platform complexity.

## Author

Югатн (Yugatn)
