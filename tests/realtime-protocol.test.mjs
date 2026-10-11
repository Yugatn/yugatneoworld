import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const server = readFileSync(join(root, "server/index.js"), "utf8");
const realtime = readFileSync(join(root, "src/integration/realtime.js"), "utf8");
const index = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "style.css"), "utf8");
const boot = readFileSync(join(root, "src/boot.js"), "utf8");
const app = readFileSync(join(root, "src/app.js"), "utf8");
const appCorePath = join(root, "src/app-core.js");
const appSrc = existsSync(appCorePath) ? readFileSync(appCorePath, "utf8") + "\n" + app : app;

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
assert.ok(index.includes("voice-btn"));
assert.ok(css.includes("safe-area-inset") && css.includes(".joystick") && css.includes(".toast"));
assert.ok(css.includes("voice-btn") || css.includes("#voice-btn"));
assert.ok(appSrc.includes("setBubble") && appSrc.includes("showToast"));
assert.ok(appSrc.includes("openCinema") && appSrc.includes("toggleDoor") && appSrc.includes("buildStreetPlaces"));
assert.ok(appSrc.includes("openGrantKey") && appSrc.includes("mergeRemoteFurniture"));
assert.ok(boot.includes("app.js"));
const voice = readFileSync(join(root, "src/domain/voice-commands.js"), "utf8");
assert.ok(voice.includes("matchVoiceCommand") && voice.includes("door.open"));
assert.ok(voice.includes("smarthome.panel") && voice.includes("lights.on"));
const voiceUi = readFileSync(join(root, "src/integration/voice-ui.js"), "utf8");
assert.ok(voiceUi.includes("startVoice") && voiceUi.includes("runVoiceCommand") && voiceUi.includes("attachVoice"));
assert.ok(voiceUi.includes("openSmartHome") || voiceUi.includes("smartHomeLights"));
assert.ok(appSrc.includes("attachVoice") || (appSrc.includes("startVoice") && appSrc.includes("runVoiceCommand")), "app must wire voice (attachVoice or startVoice)");
const smartHome = readFileSync(join(root, "src/domain/smart-home.js"), "utf8");
assert.ok(smartHome.includes("createSmartHome") && smartHome.includes("roomLightFactor"));
assert.ok(appSrc.includes("openSmartHome") && appSrc.includes("smartHome"));
console.log("realtime/mobile protocol tests OK");
