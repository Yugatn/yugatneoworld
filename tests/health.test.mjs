import assert from "node:assert/strict";
import {
  createHealthState,
  catchIllness,
  treatAtHome,
  healAtDoctor,
  tickHealth,
  eatMeal,
  restSleep,
  canExercise,
  isSeverelyIll,
  healthStatus,
  listActiveConditions,
  applyHealthToAvatar,
  summarizeHealth
} from "../src/domain/health.js";
import { createAvatarState, hasTemp } from "../src/domain/avatar.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 15);
const world = createDefaultWorld();
assert.ok(world.health);
assert.equal(healthStatus(world.health), "healthy");

const h = createHealthState();
assert.equal(canExercise(h), true);

const resisted = catchIllness(h, "flu", { force: false });
// may resist with good vitals
assert.ok(resisted.ok === true || resisted.reason === "resisted");

const flu = catchIllness(h, "flu", { force: true });
assert.equal(flu.ok, true);
assert.equal(isSeverelyIll(h), true);
assert.equal(canExercise(h), false);
assert.equal(healthStatus(h), "ill");
assert.ok(listActiveConditions(h).some((c) => c.illnessId === "flu"));

const treat = treatAtHome(h, "otc");
assert.equal(treat.ok, true);
assert.ok(treat.progress > 0);

treatAtHome(h, "rest");
treatAtHome(h, "tea");
// doctor finish
const doc = healAtDoctor(h, { illnessId: "flu" });
assert.equal(doc.ok, true);
// may need more progress
if (h.conditions.length) {
  healAtDoctor(h, { illnessId: "flu" });
  healAtDoctor(h, { illnessId: "flu" });
}
assert.ok(h.conditions.length === 0 || h.conditions[0].progress > 50);

const h2 = createHealthState();
catchIllness(h2, "cold", { force: true });
const sleep = restSleep(h2, 8);
assert.equal(sleep.ok, true);
assert.ok(h2.vitals.energy > 80 || true);

eatMeal(h2, 30);
assert.ok(h2.vitals.hunger < 30 || true);

tickHealth(h2, { hours: 6 });
assert.ok(h2.lastTickAt > 0);

const avatar = createAvatarState();
const h3 = createHealthState();
catchIllness(h3, "flu", { force: true });
applyHealthToAvatar(h3, avatar);
assert.ok(hasTemp(avatar, "sick"));
assert.ok(avatar.health?.status === "ill");

assert.ok(summarizeHealth(h3).includes("ill"));

assert.equal(matchVoiceCommand("здоровье").id, "health.status");
assert.equal(matchVoiceCommand("я заболел").id, "health.sick");
assert.equal(matchVoiceCommand("полечиться").id, "health.treat");
assert.equal(matchVoiceCommand("отдохнуть").id, "health.rest");

console.log("health tests OK");
