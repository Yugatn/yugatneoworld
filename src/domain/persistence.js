import { WORLD_VERSION, createDefaultWorld } from "./world.js";
import { createInventory } from "./inventory.js";
import { createSmartHome } from "./smart-home.js";
import { createAvatarState, toLegacyAppearance } from "./avatar.js";
import { createOrderBook } from "./commerce.js";
import { createScheduleState } from "./schedule.js";
import { createClassesState } from "./classes.js";
import { createSchoolModeState } from "./school-mode.js";

const KEY = "yugatn-eworld-v0.1";

function isValidWorld(data) {
  return data
    && typeof data === "object"
    && data.avatar
    && typeof data.avatar.x === "number"
    && typeof data.avatar.y === "number"
    && Array.isArray(data.objects);
}

function ensureAvatarState(data) {
  if (data.avatarState) {
    data.avatarState = createAvatarState(data.avatarState);
  } else {
    data.avatarState = createAvatarState();
  }
  data.avatar.appearance = toLegacyAppearance(data.avatarState);
  return data;
}

function ensureCommerce(data) {
  data.commerce = createOrderBook(data.commerce || {});
  return data;
}

function ensureLife(data) {
  data.schedule = createScheduleState(data.schedule || {});
  data.classes = createClassesState(data.classes || {});
  data.schoolMode = createSchoolModeState(data.schoolMode || {});
  return data;
}

export function loadWorld(fallback = createDefaultWorld()) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = structuredClone(fallback);
      if (!fresh.inventory) fresh.inventory = createInventory();
      if (!fresh.smartHome) fresh.smartHome = createSmartHome();
      if (!fresh.avatarState) fresh.avatarState = createAvatarState();
      if (!fresh.commerce) fresh.commerce = createOrderBook();
      if (!fresh.schedule) fresh.schedule = createScheduleState();
      if (!fresh.classes) fresh.classes = createClassesState();
      if (!fresh.schoolMode) fresh.schoolMode = createSchoolModeState();
      return fresh;
    }
    const data = JSON.parse(raw);
    if (!isValidWorld(data)) {
      const fresh = structuredClone(fallback);
      if (!fresh.inventory) fresh.inventory = createInventory();
      if (!fresh.smartHome) fresh.smartHome = createSmartHome();
      if (!fresh.avatarState) fresh.avatarState = createAvatarState();
      if (!fresh.commerce) fresh.commerce = createOrderBook();
      if (!fresh.schedule) fresh.schedule = createScheduleState();
      if (!fresh.classes) fresh.classes = createClassesState();
      if (!fresh.schoolMode) fresh.schoolMode = createSchoolModeState();
      return fresh;
    }
    if (data.version !== WORLD_VERSION) {
      const fresh = structuredClone(fallback);
      fresh.avatar = {
        ...fresh.avatar,
        x: data.avatar.x,
        y: data.avatar.y,
        appearance: data.avatar.appearance || fresh.avatar.appearance
      };
      if (data.apartment?.currentRoom && fresh.apartment) {
        const roomIds = (fresh.apartment.rooms || []).map((r) => r.id);
        if (roomIds.includes(data.apartment.currentRoom)) {
          fresh.apartment.currentRoom = data.apartment.currentRoom;
        }
      }
      if (data.apartment && typeof data.apartment.doorOpen === "boolean") {
        fresh.apartment.doorOpen = data.apartment.doorOpen;
      }
      const movable = (data.objects || []).filter((o) => o.movable && o.inventoryItemId);
      if (movable.length) {
        fresh.objects = fresh.objects.concat(movable);
        const placedIds = new Set(movable.map((o) => o.inventoryItemId));
        fresh.inventory = (data.inventory || createInventory()).filter((i) => !placedIds.has(i.id));
      } else {
        fresh.inventory = data.inventory || createInventory();
      }
      if (data.smartHome) {
        fresh.smartHome = createSmartHome(data.smartHome);
      }
      if (data.avatarState) {
        fresh.avatarState = createAvatarState(data.avatarState);
        fresh.avatar.appearance = toLegacyAppearance(fresh.avatarState);
      }
      if (data.commerce) {
        fresh.commerce = createOrderBook(data.commerce);
      }
      if (data.schedule) {
        fresh.schedule = createScheduleState(data.schedule);
      }
      if (data.classes) {
        fresh.classes = createClassesState(data.classes);
      }
      if (data.schoolMode) {
        fresh.schoolMode = createSchoolModeState(data.schoolMode);
      }
      return fresh;
    }
    if (!data.apartment) data.apartment = structuredClone(fallback.apartment);
    if (!Array.isArray(data.inventory)) data.inventory = createInventory();
    if (!data.smartHome) data.smartHome = createSmartHome();
    else data.smartHome = createSmartHome(data.smartHome);
    ensureAvatarState(data);
    ensureCommerce(data);
    ensureLife(data);
    return data;
  } catch {
    const fresh = structuredClone(fallback);
    if (!fresh.inventory) fresh.inventory = createInventory();
    if (!fresh.smartHome) fresh.smartHome = createSmartHome();
    if (!fresh.avatarState) fresh.avatarState = createAvatarState();
    if (!fresh.commerce) fresh.commerce = createOrderBook();
    if (!fresh.schedule) fresh.schedule = createScheduleState();
    if (!fresh.classes) fresh.classes = createClassesState();
    if (!fresh.schoolMode) fresh.schoolMode = createSchoolModeState();
    return fresh;
  }
}

export function saveWorld(world) {
  try {
    if (world.avatarState) {
      world.avatar = world.avatar || {};
      world.avatar.appearance = toLegacyAppearance(world.avatarState);
    }
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
