const catalog = [
  { id: "cafe-1", name: "Local Cafe", category: "cafe", items: [
    { id: "coffee", name: "Coffee", price: 4.5 },
    { id: "sandwich", name: "Sandwich", price: 7.5 }
  ]},
  { id: "restaurant-1", name: "Neighbour Restaurant", category: "restaurant", items: [
    { id: "soup", name: "Soup", price: 8 },
    { id: "pasta", name: "Pasta", price: 12 }
  ]},
  { id: "store-1", name: "Local Market", category: "store", items: [
    { id: "fruit", name: "Fruit", price: 5 },
    { id: "bread", name: "Bread", price: 3 }
  ]}
];

export function getFoodCatalog() {
  return catalog.map(vendor => ({ ...vendor, items: vendor.items.map(item => ({ ...item })) }));
}

export function createOrder(vendorId, itemId) {
  const vendor = catalog.find(v => v.id === vendorId);
  const item = vendor?.items.find(i => i.id === itemId);
  if (!vendor || !item) throw new Error("Unknown commerce item");
  return {
    orderId: "draft-" + Date.now(),
    vendorId: vendor.id,
    vendorName: vendor.name,
    itemId: item.id,
    itemName: item.name,
    total: item.price,
    currency: "EUR",
    status: "draft",
    requiresConfirmation: true
  };
}
