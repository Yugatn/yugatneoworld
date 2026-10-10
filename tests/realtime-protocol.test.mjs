import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const realtime = readFileSync(new URL("../src/integration/realtime.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

for (const token of ["room.join", "avatar.move", "chat.message", "profile.update", "scene.change", "presence.invite"]) {
  assert.ok(server.includes(token), "server missing " + token);
  assert.ok(realtime.includes(token.split(".")[0]) || realtime.includes(token), "client touches " + token);
}
assert.ok(index.includes("joystick"), "mobile joystick markup");
assert.ok(index.includes("mp-panel"), "multiplayer panel");
assert.ok(index.includes("manifest.webmanifest"), "PWA manifest link");
assert.ok(css.includes("safe-area-inset"), "safe area insets");
assert.ok(css.includes(".joystick"), "joystick styles");
console.log("realtime/mobile protocol tests OK");
