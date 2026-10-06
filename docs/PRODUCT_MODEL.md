# Product Model — Yugatn eWorld

A user is represented by identity, avatar and persistent personal space. The apartment is the primary social surface.

## Apartment

Apartment contains rooms; rooms contain objects; objects have coordinates, appearance, interaction behavior and ownership.

## WorldObject

Fields: id, type, position, rotation, scale, asset, owner, interaction, state, inventoryItemId.

Interaction examples: mailbox.send_message, mailbox.read_messages, laptop.open_social, tv.play_video, player.play_audio, wardrobe.change_avatar, door.enter_room, shop.purchase_item.

## Avatar

Fields: identity, position, direction, appearance, wardrobe, animation, interactionState.

Appearance should be composable: body, hair, face, clothing, accessories and carried item.

## WorldState

Versioned and serializable. Contains apartment, rooms, objects, avatar, inventory and permissions.

## Social graph

Friendship is separate from physical world state. A visual visit must not implicitly grant social permissions.

## Visit

A temporary visitor presence is subject to host permissions and has visitor, host, apartment, start, end and permission scope.

## Messages

Message storage is independent from the mailbox object. The mailbox is a spatial client for messaging.

## Media

Media is independent from player objects: MediaItem, PlayerObject, PlaybackSession. Television, laptop and future devices can share compatible media.

## Inventory

Inventory items can be instantiated as apartment objects. Removing an object need not destroy ownership.

## Accessibility

Spatial interaction must have keyboard/focus and direct-command fallbacks. Accessibility augments the world interface rather than replacing it.

## Design invariant

**The object is the interface.** A conventional button may provide fallback access, but the spatial world remains the primary interaction model.
