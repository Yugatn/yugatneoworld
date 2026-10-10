import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const realtime = readFileSync(new URL("../src/integration/realtime.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

for (const token of ["room.join", "avatar.move", "chat.message", "profile.update", "scene.change", "presence.invite", "emote.play"]) {
  assert.ok(server.includes(token), "server missing " + token);
}
assert.ok(realtime.includes("emote"), "client emote API");
assert.ok(index.includes("joystick") && index.includes("mp-panel"));
assert.ok(index.includes("emote-row") && index.includes("toast"));
assert.ok(index.includes("room-label"));
assert.ok(css.includes("safe-area-inset") && css.includes(".joystick") && css.includes(".toast"));
assert.ok(main.includes("setBubble") && main.includes("showToast"));
console.log("realtime/mobile protocol tests OK");
