import assert from "node:assert/strict";
import {
  createAnonBrowserState,
  openBrowser,
  openAtComputer,
  search,
  openPage,
  newCircuit,
  closeBrowser,
  findNearestComputer,
  summarizeAnonBrowser,
  KNOWLEDGE_INDEX
} from "../src/domain/anon-browser.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 21);
const world = createDefaultWorld();
assert.ok(world.anonBrowser);
assert.ok(KNOWLEDGE_INDEX.length >= 5);

const laptop = world.objects.find((o) => o.id === "laptop");
assert.ok(laptop);
assert.ok(
  (laptop.capabilities || []).includes("browser.anonymous"),
  "laptop should expose browser.anonymous"
);

// Far from laptop
world.avatar.x = 0;
world.avatar.y = 0;
assert.equal(findNearestComputer(world, world.avatar), null);

// Near laptop
world.avatar.x = laptop.x;
world.avatar.y = laptop.y;
assert.ok(findNearestComputer(world, world.avatar));

const st = createAnonBrowserState();
const opened = openAtComputer(st, world, { userId: "local" });
assert.equal(opened.ok, true);
assert.equal(opened.session.mode, "anonymous");

const sid = opened.session.id;
const found = search(st, sid, "эскроу оплата");
assert.equal(found.ok, true);
assert.ok(found.results.length >= 1);
assert.ok(found.results.some((r) => /эскроу|оплат/i.test(r.title + r.snippet)));

const page = openPage(st, sid, found.results[0].id);
assert.equal(page.ok, true);
assert.ok(page.page.body);

const circuit = newCircuit(st, sid);
assert.equal(circuit.ok, true);
assert.equal(circuit.session.historyCount, 0);
assert.notEqual(circuit.session.circuitId, opened.session.circuitId);

assert.equal(closeBrowser(st, sid).ok, true);
assert.equal(search(st, sid, "test").reason, "not_found");

const direct = openBrowser(st, { userId: "u1", computerId: "study-laptop" });
assert.equal(direct.ok, true);
search(st, direct.session.id, "школа");
assert.ok(summarizeAnonBrowser(st).includes("open"));

assert.equal(matchVoiceCommand("анонимный браузер").id, "browser.anonymous");
assert.equal(matchVoiceCommand("приватный поиск").id, "browser.search");
assert.equal(matchVoiceCommand("новая цепочка").id, "browser.newcircuit");

console.log("anon-browser tests OK");
