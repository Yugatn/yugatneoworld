# Podcasts & live broadcast v0.1

## Solo listen

- Catalog shows (City of Rooms, Orbit Talk, School Notes)
- `playEpisode` / `pausePlayback` / `resumePlayback` / `seekPlayback` / `stopPlayback`
- `subscribe` / `unsubscribe`
- Objects: **Music Player**, sofa, laptop — `podcast.play`

## Live broadcast (трансляция)

- `startLiveBroadcast(hostId, { title, showId?, episodeId? })`
- `joinLive` / `leaveLive`
- `inviteToPodcast` + `respondToPodcastInvite` — as with cinema
- `endLiveBroadcast`
- Max **40** listeners

## Voice

- подкаст / слушать подкаст → `podcast.play`
- прямой эфир / трансляция подкаста → `podcast.live`

## Not in v0.1

- Real streaming CDN / WebRTC audio
- RSS import from external feeds
- Monetization / paid episodes
