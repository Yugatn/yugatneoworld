import { WORLD_VERSION, createDefaultWorld } from "./world.js";
import { createInventory } from "./inventory.js";
import { createSmartHome } from "./smart-home.js";

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
    if (!raw) {
      const fresh = structuredClone(fallback);
      if (!fresh.inventory) fresh.inventory = createInventory();
      if (!fresh.smartHome) fresh.smartHome = createSmartHome();
      return fresh;
    }
    const data = JSON.parse(raw);
    if (!isValidWorld(data)) {
      const fresh = structuredClone(fallback);
      if (!fresh.inventory) fresh.inventory = createInventory();
      if (!fresh.smartHome) fresh.smartHome = createSmartHome();
      return fresh;
    }
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
      if (data.apartment && typeof data.apartment.doorOpen === "boolean") {
        fresh.apartment.doorOpen = data.apartment.doorOpen;
      }
      // Preserve placed furniture (movable objects) across version bumps when possible.
      const movable = (data.objects || []).filter((o) => o.movable && o.inventoryItemId);
      if (movable.length) {
        fresh.objects = fresh.objects.concat(movable);
        const placedIds = new Set(movable.map((o) => o.inventoryItemId));
        fresh.inventory = (data.inventory || createInventory()).filter((i) => !placedIds.has(i.id));
      } else {
        fresh.inventory = data.inventory || createInventory();
      }
      // Preserve smart-home digital copy if present
      if (data.smartHome) {
        fresh.smartHome = createSmartHome(data.smartHome);
      }
      return fresh;
    }
    if (!data.apartment) data.apartment = structuredClone(fallback.apartment);
    if (!Array.isArray(data.inventory)) data.inventory = createInventory();
    if (!data.smartHome) data.smartHome = createSmartHome();
    else data.smartHome = createSmartHome(data.smartHome);
    return data;
  } catch {
    const fresh = structuredClone(fallback);
    if (!fresh.inventory) fresh.inventory = createInventory();
    if (!fresh.smartHome) fresh.smartHome = createSmartHome();
    return fresh;
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
