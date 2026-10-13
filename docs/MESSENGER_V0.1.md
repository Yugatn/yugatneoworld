# Messenger (DM) v0.1

1:1 threads between users. By default only **friends** can message.

## API

- `openThread(state, fromId, toId, { socialState, friendsOnly })`
- `sendMessage(state, fromId, toId, text, { socialState, notifyState, friendsOnly })`
- `listThreads` · `getThreadMessages` · `markThreadRead` · `unreadTotal`

## Limits

- message ≤ 2000 chars (sanitized)
- 200 messages / thread (rolling)
- 50 threads / user

## World

Mailbox + laptops: `messenger.dm` · `messenger.list`  
`WORLD_VERSION` **24** · `world.messenger`

## Voice

сообщения · написать сообщение · мессенджер
