import assert from "node:assert/strict";
import {
  createAvatarState,
  equip,
  ownClothing,
  shaveAtHome,
  haircutAtBarber,
  getEffectiveAppearance,
  resolveFacialHair,
  hasTemp,
  listWardrobe,
  setBaseFeature,
  STUBBLE_AFTER_MS,
  BEARD_AFTER_MS,
  CLOTHING_CATALOG
} from "../src/domain/avatar.js";

const a = createAvatarState();
assert.equal(a.base.hairStyle, "short");
assert.ok(a.wardrobe.includes("top-casual"));
assert.equal(a.worn.top, "top-casual");

// Equip owned
const eq = equip(a, "top-hoodie");
assert.equal(eq.ok, true);
assert.equal(a.worn.top, "top-hoodie");

// Cannot equip unowned formal until owned
assert.equal(equip(a, "top-formal").ok, false);
ownClothing(a, "top-formal");
assert.equal(equip(a, "top-formal").ok, true);
assert.ok(hasTemp(a, "dressed_up"));

// Shave
const now = Date.now();
const sh = shaveAtHome(a, now);
assert.equal(sh.ok, true);
assert.equal(a.base.facialHair, "none");
assert.ok(hasTemp(a, "fresh_shave", now));
assert.equal(resolveFacialHair(a, now + 1000), "none");
assert.equal(resolveFacialHair(a, now + STUBBLE_AFTER_MS + 1000), "stubble");
assert.equal(resolveFacialHair(a, now + BEARD_AFTER_MS + 1000), "beard");

// Haircut
const hc = haircutAtBarber(a, { style: "buzz", color: "black", now });
assert.equal(hc.ok, true);
assert.equal(a.base.hairStyle, "buzz");
assert.equal(a.base.hairColor, "black");
assert.ok(hasTemp(a, "new_haircut", now));
assert.ok(hasTemp(a, "wet_hair", now));

const app = getEffectiveAppearance(a, now);
assert.equal(app.hairStyle, "buzz");
assert.equal(app.clothes.top, "top-formal");
assert.ok(app.temps.includes("new_haircut"));

assert.ok(setBaseFeature(a, "skin", "dark"));
assert.equal(setBaseFeature(a, "skin", "purple"), false);

const w = listWardrobe(a);
assert.ok(w.top.length >= 2);
assert.ok(CLOTHING_CATALOG["shoes-sneakers"]);

console.log("avatar tests OK");
