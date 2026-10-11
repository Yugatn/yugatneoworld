/**
 * Avatar appearance, clothing wardrobe, temporary overlays,
 * and functional care actions (shave at home, haircut in city).
 * Pure domain — no DOM / network.
 */

export const HAIR_STYLES = Object.freeze([
  "short", "medium", "long", "buzz", "curly", "ponytail", "bald"
]);

export const HAIR_COLORS = Object.freeze([
  "black", "brown", "blond", "red", "gray", "white"
]);

export const FACIAL_HAIR = Object.freeze([
  "none", "stubble", "beard", "mustache"
]);

export const SKIN_TONES = Object.freeze([
  "light", "medium", "tan", "dark"
]);

export const BODY_TYPES = Object.freeze(["default", "slim", "athletic"]);

/** Clothing slots worn on the avatar. */
export const CLOTHING_SLOTS = Object.freeze([
  "top", "bottom", "shoes", "accessory"
]);

/** Catalog of wearable items (owned in wardrobe). */
export const CLOTHING_CATALOG = Object.freeze({
  "top-casual": { slot: "top", name: "Casual shirt", label: "👕", style: "casual" },
  "top-formal": { slot: "top", name: "Formal shirt", label: "👔", style: "formal" },
  "top-sport": { slot: "top", name: "Sport tee", label: "🎽", style: "sport" },
  "top-hoodie": { slot: "top", name: "Hoodie", label: "🧥", style: "casual" },
  "bottom-jeans": { slot: "bottom", name: "Jeans", label: "👖", style: "casual" },
  "bottom-formal": { slot: "bottom", name: "Dress pants", label: "👖", style: "formal" },
  "bottom-sport": { slot: "bottom", name: "Track pants", label: "🩳", style: "sport" },
  "shoes-sneakers": { slot: "shoes", name: "Sneakers", label: "👟", style: "casual" },
  "shoes-formal": { slot: "shoes", name: "Dress shoes", label: "👞", style: "formal" },
  "shoes-sport": { slot: "shoes", name: "Trainers", label: "👟", style: "sport" },
  "acc-glasses": { slot: "accessory", name: "Glasses", label: "👓", style: "neutral" },
  "acc-hat": { slot: "accessory", name: "Hat", label: "🧢", style: "casual" },
  "acc-scarf": { slot: "accessory", name: "Scarf", label: "🧣", style: "casual" }
});

/** Temporary overlay ids and default durations (ms). */
export const TEMP_EFFECTS = Object.freeze({
  fresh_shave: { label: "Freshly shaved", durationMs: 6 * 60 * 60 * 1000 },
  new_haircut: { label: "New haircut", durationMs: 24 * 60 * 60 * 1000 },
  wet_hair: { label: "Wet hair", durationMs: 30 * 60 * 1000 },
  tired: { label: "Tired", durationMs: 2 * 60 * 60 * 1000 },
  dressed_up: { label: "Dressed up", durationMs: 8 * 60 * 60 * 1000 }
});

/** How long after a shave until stubble appears (ms). */
export const STUBBLE_AFTER_MS = 18 * 60 * 60 * 1000;
/** How long until full beard if never shaved again. */
export const BEARD_AFTER_MS = 5 * 24 * 60 * 60 * 1000;

export function createAvatarState(seed = {}) {
  const base = seed.base && typeof seed.base === "object" ? seed.base : {};
  const worn = seed.worn && typeof seed.worn === "object" ? seed.worn : {};
  return {
    base: {
      body: BODY_TYPES.includes(base.body) ? base.body : "default",
      skin: SKIN_TONES.includes(base.skin) ? base.skin : "medium",
      hairStyle: HAIR_STYLES.includes(base.hairStyle) ? base.hairStyle : "short",
      hairColor: HAIR_COLORS.includes(base.hairColor) ? base.hairColor : "brown",
      facialHair: FACIAL_HAIR.includes(base.facialHair) ? base.facialHair : "none"
    },
    /** Currently equipped clothing item ids by slot */
    worn: {
      top: typeof worn.top === "string" ? worn.top : "top-casual",
      bottom: typeof worn.bottom === "string" ? worn.bottom : "bottom-jeans",
      shoes: typeof worn.shoes === "string" ? worn.shoes : "shoes-sneakers",
      accessory: worn.accessory != null ? worn.accessory : null
    },
    /** Owned clothing item ids */
    wardrobe: Array.isArray(seed.wardrobe)
      ? [...new Set(seed.wardrobe.filter((id) => CLOTHING_CATALOG[id]))]
      : ["top-casual", "bottom-jeans", "shoes-sneakers", "top-hoodie"],
    /** Temporary overlays: { id, expiresAt } */
    temps: Array.isArray(seed.temps)
      ? seed.temps.map((t) => ({ id: String(t.id), expiresAt: Number(t.expiresAt) || 0 }))
      : [],
    /** Timestamp of last shave (for growth simulation) */
    lastShaveAt: typeof seed.lastShaveAt === "number" ? seed.lastShaveAt : null,
    /** Timestamp of last haircut */
    lastHaircutAt: typeof seed.lastHaircutAt === "number" ? seed.lastHaircutAt : null
  };
}

export function purgeExpiredTemps(state, now = Date.now()) {
  state.temps = (state.temps || []).filter((t) => t.expiresAt > now);
  return state;
}

export function hasTemp(state, effectId, now = Date.now()) {
  purgeExpiredTemps(state, now);
  return state.temps.some((t) => t.id === effectId);
}

export function applyTemp(state, effectId, now = Date.now(), durationMs = null) {
  const def = TEMP_EFFECTS[effectId];
  if (!def) return false;
  const ms = durationMs != null ? Math.max(60_000, Number(durationMs)) : def.durationMs;
  state.temps = (state.temps || []).filter((t) => t.id !== effectId);
  state.temps.push({ id: effectId, expiresAt: now + ms });
  return true;
}

export function clearTemp(state, effectId) {
  const before = state.temps.length;
  state.temps = (state.temps || []).filter((t) => t.id !== effectId);
  return before !== state.temps.length;
}

/** Simulate facial-hair growth from lastShaveAt. */
export function resolveFacialHair(state, now = Date.now()) {
  if (state.base.facialHair === "mustache") return "mustache";
  if (state.lastShaveAt == null) return state.base.facialHair;
  const elapsed = now - state.lastShaveAt;
  if (elapsed < STUBBLE_AFTER_MS) return "none";
  if (elapsed < BEARD_AFTER_MS) return "stubble";
  return "beard";
}

/**
 * Effective appearance for rendering / multiplayer snapshot.
 * Merges base + worn clothing labels + active temps + growth.
 */
export function getEffectiveAppearance(state, now = Date.now()) {
  purgeExpiredTemps(state, now);
  const facial = resolveFacialHair(state, now);
  const wornLabels = {};
  for (const slot of CLOTHING_SLOTS) {
    const id = state.worn[slot];
    if (id && CLOTHING_CATALOG[id]) wornLabels[slot] = CLOTHING_CATALOG[id].name;
    else wornLabels[slot] = null;
  }
  return {
    body: state.base.body,
    skin: state.base.skin,
    hairStyle: state.base.hairStyle,
    hairColor: state.base.hairColor,
    facialHair: facial,
    clothes: {
      top: state.worn.top,
      bottom: state.worn.bottom,
      shoes: state.worn.shoes,
      accessory: state.worn.accessory
    },
    clothesLabels: wornLabels,
    temps: state.temps.map((t) => t.id),
    // Legacy-compatible flat fields used by older world.avatar.appearance
    hair: state.base.hairStyle,
    clothesStyle: clothingStyleTag(state)
  };
}

function clothingStyleTag(state) {
  const top = CLOTHING_CATALOG[state.worn.top];
  return top?.style || "casual";
}

export function ownClothing(state, itemId) {
  if (!CLOTHING_CATALOG[itemId]) return false;
  if (!state.wardrobe.includes(itemId)) state.wardrobe.push(itemId);
  return true;
}

export function equip(state, itemId) {
  const item = CLOTHING_CATALOG[itemId];
  if (!item) return { ok: false, reason: "unknown_item" };
  if (!state.wardrobe.includes(itemId)) return { ok: false, reason: "not_owned" };
  state.worn[item.slot] = itemId;
  if (item.style === "formal") applyTemp(state, "dressed_up");
  return { ok: true, slot: item.slot, itemId };
}

export function unequip(state, slot) {
  if (!CLOTHING_SLOTS.includes(slot)) return false;
  if (slot === "accessory") {
    state.worn.accessory = null;
    return true;
  }
  // Keep a default for required slots
  const defaults = { top: "top-casual", bottom: "bottom-jeans", shoes: "shoes-sneakers" };
  state.worn[slot] = defaults[slot] || null;
  return true;
}

export function setBaseFeature(state, key, value) {
  const maps = {
    body: BODY_TYPES,
    skin: SKIN_TONES,
    hairStyle: HAIR_STYLES,
    hairColor: HAIR_COLORS,
    facialHair: FACIAL_HAIR
  };
  const allowed = maps[key];
  if (!allowed || !allowed.includes(value)) return false;
  state.base[key] = value;
  return true;
}

/**
 * Shave at home (mirror / bathroom).
 * Clears facial hair growth clock and applies temporary fresh_shave.
 */
export function shaveAtHome(state, now = Date.now()) {
  state.lastShaveAt = now;
  state.base.facialHair = "none";
  applyTemp(state, "fresh_shave", now);
  clearTemp(state, "tired");
  return {
    ok: true,
    facialHair: "none",
    effect: "fresh_shave",
    message: "Shaved. Looking fresh."
  };
}

/**
 * Haircut at a barbershop / salon in the city.
 * Permanently changes hairStyle (and optionally color); adds new_haircut temp.
 */
export function haircutAtBarber(state, { style, color, now = Date.now() } = {}) {
  if (style && HAIR_STYLES.includes(style)) {
    state.base.hairStyle = style;
  }
  if (color && HAIR_COLORS.includes(color)) {
    state.base.hairColor = color;
  }
  state.lastHaircutAt = now;
  applyTemp(state, "new_haircut", now);
  applyTemp(state, "wet_hair", now, TEMP_EFFECTS.wet_hair.durationMs);
  return {
    ok: true,
    hairStyle: state.base.hairStyle,
    hairColor: state.base.hairColor,
    effects: ["new_haircut", "wet_hair"],
    message: `Haircut done: ${state.base.hairStyle} (${state.base.hairColor}).`
  };
}

/** List owned clothes grouped by slot for UI. */
export function listWardrobe(state) {
  const bySlot = { top: [], bottom: [], shoes: [], accessory: [] };
  for (const id of state.wardrobe) {
    const item = CLOTHING_CATALOG[id];
    if (!item) continue;
    bySlot[item.slot].push({
      id,
      name: item.name,
      label: item.label,
      style: item.style,
      equipped: state.worn[item.slot] === id
    });
  }
  return bySlot;
}

export function summarizeAvatar(state, now = Date.now()) {
  const app = getEffectiveAppearance(state, now);
  const temps = app.temps
    .map((id) => TEMP_EFFECTS[id]?.label || id)
    .join(", ");
  return [
    `Hair: ${app.hairStyle} / ${app.hairColor}`,
    `Face: ${app.facialHair}`,
    `Wear: ${app.clothesLabels.top || "—"}, ${app.clothesLabels.bottom || "—"}, ${app.clothesLabels.shoes || "—"}`,
    temps ? `Now: ${temps}` : "No temporary effects"
  ].join(" · ");
}

/** Sync compact appearance into legacy world.avatar.appearance shape. */
export function toLegacyAppearance(state, now = Date.now()) {
  const app = getEffectiveAppearance(state, now);
  return {
    body: app.body,
    hair: app.hairStyle,
    clothes: app.clothesStyle,
    skin: app.skin,
    hairColor: app.hairColor,
    facialHair: app.facialHair,
    worn: { ...app.clothes },
    temps: [...app.temps]
  };
}
