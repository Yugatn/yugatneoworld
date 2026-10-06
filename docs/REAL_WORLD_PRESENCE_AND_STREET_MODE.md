# Real-World Presence and Street Mode

## Purpose

eWorld may expose an optional spatial layer representing the user's current real-world context.

This is a capability, not a requirement for using the social network.

## Street mode

A user may explicitly change their social status to a street/outside mode.

When street mode is active, the eWorld interface can switch from the apartment to a contextual street scene containing virtual representations of services such as:

- bus and tram stops;
- city maps;
- gyms;
- yoga centres;
- educational institutions;
- cafes and restaurants;
- shops;
- parks and other public places.

The virtual street is an interface layer. It does not imply that the user is physically at a represented place unless a trusted location signal has explicitly established that fact.

## Real-world proximity

Two users may optionally receive a social bonus when they physically meet in the real world.

A valid proximity event should require:

- explicit opt-in by the participating users;
- coarse or privacy-preserving proximity proof where possible;
- a limited validity interval;
- anti-spoofing/rate-limiting controls;
- no publication of exact coordinates to other users;
- no requirement to expose a continuous location history.

The event should prove only the minimum fact needed by the feature, for example:

users A and B were co-present within an allowed proximity window.

It should not automatically reveal:

- exact coordinates;
- travel history;
- home/work location;
- continuous movement.

## Bonus model

A real-world meeting may unlock non-monetary or user-approved digital effects:

- temporary avatar items;
- room decorations;
- shared achievements;
- social badges;
- collaborative activities;
- access to an event;
- friendship interaction shortcuts.

Any commercial benefit must be explicitly disclosed and confirmed.

## Location privacy

Street mode and proximity bonuses must be separate from continuous location tracking.

The preferred architecture is:

device location signal -> local or coarse proximity computation -> minimal proof -> capability request -> event

rather than:

continuous GPS stream -> central social database

Exact location should remain local whenever the feature can work without transmitting it.

## SymbiontOS integration

SymbiontOS may mediate:

- identity;
- consent;
- capability authorization;
- privacy policy;
- retention policy;
- event provenance.

The eWorld renderer must not become the authority for location authorization.

## Street service objects

A street object can expose contextual capabilities.

### Transit stop

- city map;
- route information;
- timetable;
- navigation request.

### Gym

- information;
- membership options;
- class schedule;
- explicit purchase flow.

### Yoga centre

- classes;
- schedule;
- membership options.

### Educational institution

- courses;
- events;
- educational resources;
- application or information flow.

External service availability, prices and schedules must come from verified adapters. The virtual object itself is not evidence that a service is currently available.

## Evidence status

**PROPOSED:** street mode and real-world proximity bonus architecture.

**DERIVED:** contextual interfaces can change according to explicitly selected user mode.

**NOT_TESTED:** real-world proximity verification.

**RESIDUAL:** exact privacy-preserving proximity protocol and trusted location attestation remain to be implemented.
