# Social graph & notifications v0.1

## Friends

- `sendFriendRequest` / `acceptFriendRequest` / `declineFriendRequest`
- `listFriends` / `removeFriend` / `areFriends`
- Mutual pending requests auto-accept

## Presence

`setPresence` · `getPresence` · `listFriendsPresence`  
Statuses: online · away · busy · offline (+ optional roomId)

## Invites

Kinds: `game` · `tournament` · `cinema` · `podcast` · `visit` · `generic`  
TTL 24h · optional `friendsOnly`

## Notifications

In-world inbox (`notifications.js`): push, list, mark read, unread count.  
Types include friend_request, invite, game, marketplace, payment, school…

## World

`WORLD_VERSION` **23** · `world.social` · `world.notifications`

## Voice

друзья · уведомления · пригласить · заявки в друзья
