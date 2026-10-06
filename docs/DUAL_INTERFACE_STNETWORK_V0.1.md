# Dual Interface: eWorld + STNetwork v0.1

Yugatn eWorld and STNetwork are two interfaces over one social identity and one employment data model.

## Spatial interface

The 2D world exposes capabilities through places and objects:

- apartment laptop: jobs, resume, applications;
- mailbox: Eugene communication;
- street organizations: employers and local services;
- educational buildings: learning opportunities;
- coworking or office: work context;
- avatar wardrobe: identity presentation.

The spatial interface is exploratory and social. It must never be the only route to essential functions.

## Classic interface

The classic interface provides efficient access to:

- job search;
- vacancy filters;
- resume editing;
- skills;
- experience;
- education;
- applications;
- employers;
- work preferences.

It is intended for fast search, editing, accessibility and mobile productivity.

## Shared domain

Both interfaces consume the same domain entities:

Subject identity
Profile
Skills
Experience
Education
Resume
Job
Employer
Application
WorkPreference

A user must not maintain separate profiles for the two interfaces.

## Navigation

Spatial -> Classic is always available.

Classic -> Spatial is always available when the device supports the 2D runtime.

Actions made in either interface emit the same domain events and are subject to the same SymbiontOS authorization boundary.

## STNetwork synthesis

The employment layer preserves the earlier STNetwork direction:

- unified work profile;
- vacancy aggregation through connectors;
- skills reflection;
- project and experience signals;
- flexible work preferences;
- employer and candidate matching;
- application state;
- future connector synchronization.

External platforms are connectors, not authoritative copies of the user's identity.

## Safety and agency

Employment data is private by default.

Publishing a resume, making a profile discoverable, applying for a job, or synchronizing with an external platform requires an explicit capability.

The spatial presentation must not reveal private employment data merely because another avatar is nearby.

## Evidence status

IMPLEMENTED: shared employment domain foundation.

PROPOSED: classic UI and spatial employment objects.

NOT_TESTED: end-to-end employment workflow.
