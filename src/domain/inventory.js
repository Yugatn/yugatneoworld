export function createInventory() {
  return [
    { id: "chair-basic", type: "furniture", name: "Chair", owned: true },
    { id: "plant-basic", type: "decoration", name: "Plant", owned: true }
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
