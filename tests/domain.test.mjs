import assert from "node:assert/strict";
import { createEmploymentState, getJobs, applyToJob, submitApplication, updateResume } from "../src/domain/employment.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { scalePoint, layoutObjects, DESIGN } from "../src/domain/layout.js";
import { createCityState, findCityPlace } from "../src/domain/city.js";

const employment = createEmploymentState();
assert.equal(employment.jobs.length, 3);
assert.equal(getJobs(employment, { mode: "remote" }).length, 2);
updateResume(employment, { headline: "Builder", skills: ["js"] });
const app = applyToJob(employment, "job-1");
assert.equal(app.status, "draft");
submitApplication(employment, app.id);
assert.equal(employment.applications[0].status, "submitted");
assert.throws(() => applyToJob(employment, "missing"));

const world = createDefaultWorld();
assert.equal(world.version, WORLD_VERSION);
assert.ok(world.objects.length >= 10);
assert.ok(world.objects.every((o) => o.roomId && o.type));

const p = scalePoint(500, 280, 500, 280);
assert.equal(Math.round(p.x), 250);
assert.equal(Math.round(p.y), 140);
const laid = layoutObjects(world.objects, "livingRoom", DESIGN.width, DESIGN.height);
assert.ok(laid.length >= 5);
assert.ok(laid.every((o) => o.x >= 0 && o.y >= 0));

const city = createCityState();
assert.ok(findCityPlace(city, "company-symbiont"));
assert.equal(city.places.filter((x) => x.type === "employer").length, 2);

console.log("domain tests OK");
