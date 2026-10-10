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

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080`.

```bash
npm test
npm run check
```

Without the Node server, opening `index.html` still runs the local spatial loop; multiplayer stays offline until WebSocket is available.

Controls: mouse / touch / WASD to move · **E** interact · **Esc** close panel or leave street.

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
```

## Current implementation status

Implemented:

- 2D apartment rooms, avatar movement, proximity interaction;
- city street with employers and services;
- employment domain shared with classic STNetwork pages;
- WebSocket multiplayer presence (optional server);
- local save/load of world state;
- responsive object/city layout for varying viewport sizes;
- domain unit tests and CI validation workflow.

Still integration boundaries (not fully connected):

- Eugene Messenger transport;
- Symbiont Control Plane authorization;
- real media playback, furniture editing, accounts.

## Status

**Spatial employment loop present — company, vacancy, resume, application layers connected locally.**

Continue incrementally: validate each spatial interaction before expanding external infrastructure.

## Author

Югатн (Yugatn)
