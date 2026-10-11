/**
 * Smart Home — digital 2D copy of the apartment.
 * Controls lights per room, climate, and media power.
 * Pure domain: no DOM / WebSocket. Persists with world state.
 */

import { ROOMS } from "./apartment.js";

export const LIGHT_ROOMS = Object.freeze(Object.keys(ROOMS));

export const CLIMATE_MODES = Object.freeze(["off", "heat", "cool", "auto"]);

export const DEVICE_KINDS = Object.freeze(["light", "climate", "tv", "music"]);

function defaultLight() {
  return { on: true, brightness: 80 };
}

/** Create initial smart-home state (optional seed from persistence). */
export function createSmartHome(seed = {}) {
  const lights = {};
  for (const id of LIGHT_ROOMS) {
    const s = seed.lights?.[id];
    lights[id] = s
      ? { on: Boolean(s.on), brightness: clampBrightness(s.brightness) }
      : defaultLight();
  }
  const climateSeed = seed.climate || {};
  const mode = CLIMATE_MODES.includes(climateSeed.mode) ? climateSeed.mode : "auto";
  const targetC = clampTemp(climateSeed.targetC ?? 22);
  const media = seed.media || {};
  return {
    lights,
    climate: { mode, targetC },
    media: {
      tvOn: Boolean(media.tvOn),
      musicOn: Boolean(media.musicOn)
    }
  };
}

function clampBrightness(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 80;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function clampTemp(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 22;
  return Math.max(10, Math.min(32, Math.round(v)));
}

/** Toggle light in a room. Returns new on state or null if unknown room. */
export function toggleLight(state, roomId) {
  if (!state?.lights?.[roomId]) return null;
  state.lights[roomId].on = !state.lights[roomId].on;
  return state.lights[roomId].on;
}

/** Set light on/off. */
export function setLightOn(state, roomId, on) {
  if (!state?.lights?.[roomId]) return null;
  state.lights[roomId].on = Boolean(on);
  return state.lights[roomId].on;
}

/** Set brightness 0–100. Turns light on if brightness > 0. */
export function setBrightness(state, roomId, brightness) {
  if (!state?.lights?.[roomId]) return null;
  const b = clampBrightness(brightness);
  state.lights[roomId].brightness = b;
  if (b > 0) state.lights[roomId].on = true;
  if (b === 0) state.lights[roomId].on = false;
  return state.lights[roomId];
}

export function isLightOn(state, roomId) {
  return Boolean(state?.lights?.[roomId]?.on);
}

export function getBrightness(state, roomId) {
  return state?.lights?.[roomId]?.brightness ?? 0;
}

/** Ambient factor 0–1 for canvas tint (0 = dark, 1 = full). */
export function roomLightFactor(state, roomId) {
  const L = state?.lights?.[roomId];
  if (!L || !L.on) return 0.15;
  return 0.2 + 0.8 * (L.brightness / 100);
}

/** All lights off or on. */
export function setAllLights(state, on) {
  for (const id of LIGHT_ROOMS) {
    if (state.lights[id]) state.lights[id].on = Boolean(on);
  }
  return state;
}

export function setClimateMode(state, mode) {
  if (!CLIMATE_MODES.includes(mode)) return null;
  state.climate.mode = mode;
  return state.climate;
}

export function setTargetTemp(state, celsius) {
  state.climate.targetC = clampTemp(celsius);
  return state.climate;
}

export function adjustTemp(state, delta) {
  return setTargetTemp(state, state.climate.targetC + Number(delta || 0));
}

export function toggleTv(state) {
  state.media.tvOn = !state.media.tvOn;
  return state.media.tvOn;
}

export function setTvOn(state, on) {
  state.media.tvOn = Boolean(on);
  return state.media.tvOn;
}

export function toggleMusic(state) {
  state.media.musicOn = !state.media.musicOn;
  return state.media.musicOn;
}

export function setMusicOn(state, on) {
  state.media.musicOn = Boolean(on);
  return state.media.musicOn;
}

/** Snapshot for UI / toast / panel. */
export function summarize(state) {
  if (!state) return "no smart home";
  const lit = LIGHT_ROOMS.filter((id) => state.lights[id]?.on).length;
  return `Lights ${lit}/${LIGHT_ROOMS.length} · ${state.climate.mode} ${state.climate.targetC}°C · TV ${state.media.tvOn ? "on" : "off"} · Music ${state.media.musicOn ? "on" : "off"}`;
}

/** List devices for a panel (id, label, status). */
export function listDevices(state, currentRoom = "livingRoom") {
  const out = [];
  for (const id of LIGHT_ROOMS) {
    const L = state.lights[id];
    const roomName = ROOMS[id]?.name || id;
    out.push({
      id: `light.${id}`,
      kind: "light",
      roomId: id,
      label: `Light · ${roomName}`,
      status: L.on ? `on ${L.brightness}%` : "off",
      active: L.on
    });
  }
  out.push({
    id: "climate",
    kind: "climate",
    label: "Climate",
    status: `${state.climate.mode} ${state.climate.targetC}°C`,
    active: state.climate.mode !== "off"
  });
  out.push({
    id: "tv",
    kind: "tv",
    label: "Television",
    status: state.media.tvOn ? "on" : "off",
    active: state.media.tvOn
  });
  out.push({
    id: "music",
    kind: "music",
    label: "Music",
    status: state.media.musicOn ? "on" : "off",
    active: state.media.musicOn
  });
  // Prefer current room light first for UX
  out.sort((a, b) => {
    if (a.roomId === currentRoom) return -1;
    if (b.roomId === currentRoom) return 1;
    return 0;
  });
  return out;
}
