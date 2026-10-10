/** Catalog of placeable furniture/decoration templates. */
export const FURNITURE_CATALOG = {
  "chair-basic": { type: "furniture", subtype: "chair", name: "Chair", label: "🪑", r: 36, capabilities: ["furniture.pick"] },
  "plant-basic": { type: "decoration", subtype: "plant", name: "Plant", label: "🪴", r: 34, capabilities: ["furniture.pick"] },
  "table-basic": { type: "furniture", subtype: "table", name: "Table", label: "🪵", r: 40, capabilities: ["furniture.pick"] },
  "lamp-basic": { type: "decoration", subtype: "lamp", name: "Lamp", label: "💡", r: 32, capabilities: ["furniture.pick"] }
};

export function createInventory() {
  return [
    { id: "chair-basic", type: "furniture", name: "Chair", owned: true },
    { id: "plant-basic", type: "decoration", name: "Plant", owned: true },
    { id: "table-basic", type: "furniture", name: "Table", owned: true },
    { id: "lamp-basic", type: "decoration", name: "Lamp", owned: true }
  ];
}

export function addItem(inventory, item) {
  if (!inventory.some((entry) => entry.id === item.id)) inventory.push({ ...item, owned: true });
  return inventory;
}

export function removeItem(inventory, itemId) {
  const index = inventory.findIndex((entry) => entry.id === itemId);
  if (index >= 0) inventory.splice(index, 1);
  return inventory;
}

export function hasItem(inventory, itemId) {
  return inventory.some((entry) => entry.id === itemId && entry.owned !== false);
}

/**
 * Place an inventory item as a world object in the current room.
 * Uses design-space coordinates (layout.js DESIGN space).
 * Returns the created object or null if the item is missing / unknown.
 */
export function placeFurniture(world, inventory, itemId, roomId, x, y) {
  if (!hasItem(inventory, itemId)) return null;
  const template = FURNITURE_CATALOG[itemId];
  if (!template) return null;
  const instanceId = `${itemId}-${Date.now().toString(36)}`;
  const obj = {
    id: instanceId,
    roomId,
    type: template.type,
    subtype: template.subtype,
    name: template.name,
    label: template.label,
    x: Number(x),
    y: Number(y),
    r: template.r,
    capabilities: [...template.capabilities],
    inventoryItemId: itemId,
    movable: true
  };
  world.objects.push(obj);
  removeItem(inventory, itemId);
  return obj;
}

/**
 * Pick up a placed furniture object back into inventory.
 * Only works for movable objects with inventoryItemId.
 */
export function pickFurniture(world, inventory, objectId) {
  const index = world.objects.findIndex((o) => o.id === objectId);
  if (index < 0) return null;
  const obj = world.objects[index];
  if (!obj.movable || !obj.inventoryItemId) return null;
  const itemId = obj.inventoryItemId;
  const template = FURNITURE_CATALOG[itemId] || { type: obj.type, name: obj.name };
  world.objects.splice(index, 1);
  addItem(inventory, { id: itemId, type: template.type || obj.type, name: template.name || obj.name, owned: true });
  return obj;
}

export function listPlaceable(inventory) {
  return inventory.filter((entry) => entry.owned !== false && FURNITURE_CATALOG[entry.id]);
}
