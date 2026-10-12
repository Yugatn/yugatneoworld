import assert from "node:assert/strict";
import {
  createPodcastState,
  listShows,
  listEpisodes,
  playEpisode,
  pausePlayback,
  resumePlayback,
  seekPlayback,
  stopPlayback,
  startLiveBroadcast,
  endLiveBroadcast,
  joinLive,
  inviteToPodcast,
  respondToPodcastInvite,
  subscribe,
  nowPlaying,
  summarizePodcasts
} from "../src/domain/podcasts.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 13);
const world = createDefaultWorld();
assert.ok(world.podcasts);
assert.ok(world.objects.some((o) => (o.capabilities || []).includes("podcast.play")));
assert.ok(world.objects.some((o) => (o.capabilities || []).includes("podcast.live")));

const shows = listShows();
assert.ok(shows.length >= 2);
const eps = listEpisodes(shows[0].id);
assert.ok(eps.length >= 1);

const state = createPodcastState();
const sub = subscribe(state, shows[0].id);
assert.equal(sub.ok, true);

const play = playEpisode(state, shows[0].id, eps[0].id, { userId: "u1" });
assert.equal(play.ok, true);
assert.equal(state.status, "playing");
assert.ok(play.audioUrl);

assert.equal(pausePlayback(state).ok, true);
assert.equal(state.status, "paused");
assert.equal(resumePlayback(state).ok, true);
assert.equal(seekPlayback(state, 120).ok, true);
assert.equal(state.positionSec, 120);

const np = nowPlaying(state);
assert.equal(np.status, "playing");
assert.ok(np.episode);

stopPlayback(state);
assert.equal(state.status, "idle");

// Live broadcast
const live = startLiveBroadcast(state, "host1", {
  title: "Вечерний эфир",
  showId: shows[0].id,
  episodeId: eps[0].id
});
assert.equal(live.ok, true);
assert.equal(state.status, "live");
assert.equal(state.liveTitle, "Вечерний эфир");

const inv = inviteToPodcast(state, "host1", ["friendA", "friendB"]);
assert.equal(inv.ok, true);
assert.equal(inv.added.length, 2);

assert.equal(respondToPodcastInvite(state, "friendA", true).ok, true);
assert.ok(state.listeners.includes("friendA"));

assert.equal(joinLive(state, "friendC").ok, true);
assert.ok(state.listeners.includes("friendC"));

assert.ok(summarizePodcasts(state).includes("LIVE"));

assert.equal(endLiveBroadcast(state, "host1").ok, true);
assert.equal(state.status, "idle");

assert.equal(matchVoiceCommand("подкаст").id, "podcast.play");
assert.equal(matchVoiceCommand("слушать подкаст").id, "podcast.play");
assert.equal(matchVoiceCommand("прямой эфир").id, "podcast.live");
assert.equal(matchVoiceCommand("трансляция подкаста").id, "podcast.live");

console.log("podcasts tests OK");
