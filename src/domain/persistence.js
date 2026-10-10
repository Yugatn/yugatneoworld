import { WORLD_VERSION, createDefaultWorld } from "./world.js";

const KEY = "yugatn-eworld-v0.1";

function isValidWorld(data) {
  return data
    && typeof data === "object"
    && data.avatar
    && typeof data.avatar.x === "number"
    && typeof data.avatar.y === "number"
    && Array.isArray(data.objects);
}

export function loadWorld(fallback = createDefaultWorld()) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(fallback);
    const data = JSON.parse(raw);
    if (!isValidWorld(data)) return structuredClone(fallback);
    // Version mismatch: keep avatar position, rebuild objects/rooms from defaults.
    if (data.version !== WORLD_VERSION) {
      const fresh = structuredClone(fallback);
      fresh.avatar = {
        ...fresh.avatar,
        x: data.avatar.x,
        y: data.avatar.y,
        appearance: data.avatar.appearance || fresh.avatar.appearance
      };
      if (data.apartment?.currentRoom) {
        fresh.apartment.currentRoom = data.apartment.currentRoom;
      }
      return fresh;
    }
    if (!data.apartment) data.apartment = structuredClone(fallback.apartment);
    return data;
  } catch {
    return structuredClone(fallback);
  }
}

export function saveWorld(world) {
  try {
    localStorage.setItem(KEY, JSON.stringify(world));
    return true;
  } catch {
    return false;
  }
}

export function resetWorld() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
