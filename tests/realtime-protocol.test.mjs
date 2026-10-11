import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const realtime = readFileSync(new URL("../src/integration/realtime.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const boot = readFileSync(new URL("../src/boot.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

for (const token of [
  "room.join", "avatar.move", "chat.message", "profile.update", "scene.change",
  "presence.invite", "emote.play", "apartment.door", "visit.request", "cinema.contribute", "key.grant", "key.revoke", "furniture.place"
]) {
  assert.ok(server.includes(token), "server missing " + token);
}
assert.ok(realtime.includes("setDoorOpen") && realtime.includes("requestVisit") && realtime.includes("cinemaContribute"));
assert.ok(realtime.includes("grantKey") && realtime.includes("revokeKey"));
assert.ok(index.includes("joystick") && index.includes("mp-panel"));
assert.ok(index.includes("emote-row") && index.includes("toast"));
assert.ok(index.includes("room-label") && index.includes("account-panel"));
assert.ok(css.includes("safe-area-inset") && css.includes(".joystick") && css.includes(".toast"));
assert.ok(app.includes("setBubble") && app.includes("showToast"));
assert.ok(app.includes("openCinema") && app.includes("toggleDoor") && app.includes("buildStreetPlaces"));
assert.ok(app.includes("openGrantKey") && app.includes("mergeRemoteFurniture"));
assert.ok(boot.includes("app.js"));
console.log("realtime/mobile protocol tests OK");
