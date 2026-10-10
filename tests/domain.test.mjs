import assert from "node:assert/strict";
import { createEmploymentState, getJobs, applyToJob, submitApplication, updateResume } from "../src/domain/employment.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { scalePoint, layoutObjects, DESIGN } from "../src/domain/layout.js";
import { createCityState, findCityPlace } from "../src/domain/city.js";
import {
  createInventory, placeFurniture, pickFurniture, listPlaceable, hasItem, FURNITURE_CATALOG
} from "../src/domain/inventory.js";

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
assert.ok(Array.isArray(world.inventory));
assert.ok(world.inventory.length >= 2);

const p = scalePoint(500, 280, 500, 280);
assert.equal(Math.round(p.x), 250);
assert.equal(Math.round(p.y), 140);
const laid = layoutObjects(world.objects, "livingRoom", DESIGN.width, DESIGN.height);
assert.ok(laid.length >= 5);
assert.ok(laid.every((o) => o.x >= 0 && o.y >= 0));

const city = createCityState();
assert.ok(findCityPlace(city, "company-symbiont"));
assert.equal(city.places.filter((x) => x.type === "employer").length, 2);

// Furniture place / pick cycle
const inv = createInventory();
assert.ok(listPlaceable(inv).length >= 2);
assert.ok(FURNITURE_CATALOG["chair-basic"]);
const before = world.objects.length;
const placed = placeFurniture(world, inv, "chair-basic", "livingRoom", 400, 300);
assert.ok(placed);
assert.equal(placed.movable, true);
assert.equal(placed.inventoryItemId, "chair-basic");
assert.equal(world.objects.length, before + 1);
assert.equal(hasItem(inv, "chair-basic"), false);
const picked = pickFurniture(world, inv, placed.id);
assert.ok(picked);
assert.equal(world.objects.length, before);
assert.equal(hasItem(inv, "chair-basic"), true);
assert.equal(placeFurniture(world, inv, "missing-item", "livingRoom", 1, 1), null);

console.log("domain tests OK");
