import assert from "node:assert/strict";
import {
  createSmartHome,
  toggleLight,
  setLightOn,
  setBrightness,
  isLightOn,
  getBrightness,
  roomLightFactor,
  setAllLights,
  setClimateMode,
  setTargetTemp,
  adjustTemp,
  toggleTv,
  toggleMusic,
  summarize,
  listDevices,
  LIGHT_ROOMS,
  CLIMATE_MODES
} from "../src/domain/smart-home.js";

const sh = createSmartHome();
assert.ok(LIGHT_ROOMS.length >= 6);
assert.ok(LIGHT_ROOMS.includes("bathroom"));
assert.ok(LIGHT_ROOMS.includes("kidsRoom"));
assert.ok(isLightOn(sh, "livingRoom"));
assert.equal(getBrightness(sh, "livingRoom"), 80);
assert.ok(roomLightFactor(sh, "livingRoom") > 0.5);

toggleLight(sh, "livingRoom");
assert.equal(isLightOn(sh, "livingRoom"), false);
assert.ok(roomLightFactor(sh, "livingRoom") < 0.3);
setLightOn(sh, "livingRoom", true);
assert.ok(isLightOn(sh, "livingRoom"));

setBrightness(sh, "kitchen", 40);
assert.equal(getBrightness(sh, "kitchen"), 40);
assert.ok(isLightOn(sh, "kitchen"));
setBrightness(sh, "kitchen", 0);
assert.equal(isLightOn(sh, "kitchen"), false);

setAllLights(sh, false);
assert.ok(LIGHT_ROOMS.every((id) => !isLightOn(sh, id)));
setAllLights(sh, true);
assert.ok(LIGHT_ROOMS.every((id) => isLightOn(sh, id)));

assert.equal(setClimateMode(sh, "heat").mode, "heat");
assert.equal(setClimateMode(sh, "nope"), null);
setTargetTemp(sh, 25);
assert.equal(sh.climate.targetC, 25);
adjustTemp(sh, -3);
assert.equal(sh.climate.targetC, 22);
setTargetTemp(sh, 99);
assert.equal(sh.climate.targetC, 32);

assert.equal(toggleTv(sh), true);
assert.equal(toggleMusic(sh), true);
assert.ok(summarize(sh).includes("TV on"));

const devices = listDevices(sh, "bedroom");
assert.ok(devices.length >= 6);
assert.equal(devices[0].roomId, "bedroom");
assert.ok(CLIMATE_MODES.includes("auto"));

const seeded = createSmartHome({
  lights: { livingRoom: { on: false, brightness: 10 } },
  climate: { mode: "cool", targetC: 18 },
  media: { tvOn: true, musicOn: false }
});
assert.equal(isLightOn(seeded, "livingRoom"), false);
assert.equal(seeded.climate.mode, "cool");
assert.equal(seeded.media.tvOn, true);

assert.equal(toggleLight(sh, "no-room"), null);
assert.ok(isLightOn(sh, "bathroom"));
assert.ok(isLightOn(sh, "kidsRoom"));

console.log("smart-home tests OK");
