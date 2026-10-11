/**
 * Commerce & home delivery for the whole eWorld social graph.
 * Vendors: food, grocery, bathroom, household. Orders deliver into home supplies.
 */

export const ORDER_STATUSES = Object.freeze([
  "draft", "confirmed", "delivering", "delivered", "cancelled"
]);

/** Delivery ETA bands (ms) after confirm. */
export const DELIVERY_ETA_MS = Object.freeze({
  express: 15 * 60 * 1000,
  standard: 45 * 60 * 1000
});

const catalog = [
  {
    id: "cafe-1",
    name: "Local Cafe",
    category: "cafe",
    delivery: true,
    items: [
      { id: "coffee", name: "Coffee", price: 4.5 },
      { id: "sandwich", name: "Sandwich", price: 7.5 }
    ]
  },
  {
    id: "restaurant-1",
    name: "Neighbour Restaurant",
    category: "restaurant",
    delivery: true,
    items: [
      { id: "soup", name: "Soup", price: 8 },
      { id: "pasta", name: "Pasta", price: 12 }
    ]
  },
  {
    id: "store-1",
    name: "Local Market",
    category: "grocery",
    delivery: true,
    items: [
      { id: "fruit", name: "Fruit", price: 5 },
      { id: "bread", name: "Bread", price: 3 },
      { id: "eggs", name: "Eggs", price: 3.5 },
      { id: "butter", name: "Butter", price: 2.8 },
      { id: "salt", name: "Salt", price: 1.2 },
      { id: "pasta-dry", name: "Dry pasta", price: 2.5 },
      { id: "tomato", name: "Tomatoes", price: 3 },
      { id: "garlic", name: "Garlic", price: 1.5 },
      { id: "olive-oil", name: "Olive oil", price: 6 },
      { id: "chicken", name: "Chicken", price: 9 },
      { id: "rice", name: "Rice", price: 2.2 },
      { id: "onion", name: "Onion", price: 1.5 },
      { id: "potato", name: "Potatoes", price: 2 },
      { id: "carrot", name: "Carrots", price: 1.8 },
      { id: "yogurt", name: "Yogurt", price: 2.5 },
      { id: "milk", name: "Milk", price: 1.9 }
    ]
  },
  {
    id: "bath-shop",
    name: "Bath & Body",
    category: "bathroom",
    delivery: true,
    items: [
      { id: "shampoo", name: "Shampoo", price: 6.5 },
      { id: "soap", name: "Soap", price: 2.5 },
      { id: "towel", name: "Towel", price: 12 },
      { id: "toothpaste", name: "Toothpaste", price: 3.5 },
      { id: "toothbrush", name: "Toothbrush", price: 2.8 },
      { id: "shower-gel", name: "Shower gel", price: 5 },
      { id: "bath-salt", name: "Bath salts", price: 7 },
      { id: "toilet-paper", name: "Toilet paper", price: 4 },
      { id: "body-lotion", name: "Body lotion", price: 8 }
    ]
  },
  {
    id: "home-shop",
    name: "Home Essentials",
    category: "household",
    delivery: true,
    items: [
      { id: "detergent", name: "Laundry detergent", price: 9 },
      { id: "sponges", name: "Sponges", price: 3 },
      { id: "trash-bags", name: "Trash bags", price: 4.5 },
      { id: "dish-soap", name: "Dish soap", price: 3.2 },
      { id: "paper-towels", name: "Paper towels", price: 3.8 }
    ]
  }
];

export function getCatalog(filter = {}) {
  let list = catalog.map((v) => ({
    ...v,
    items: v.items.map((i) => ({ ...i }))
  }));
  if (filter.category) list = list.filter((v) => v.category === filter.category);
  if (filter.delivery === true) list = list.filter((v) => v.delivery);
  return list;
}

/** @deprecated prefer getCatalog — kept for older callers */
export function getFoodCatalog() {
  return getCatalog({ category: undefined }).filter((v) =>
    ["cafe", "restaurant", "grocery"].includes(v.category)
  );
}

export function getBathroomCatalog() {
  return getCatalog({ category: "bathroom" });
}

export function getGroceryCatalog() {
  return getCatalog({ category: "grocery" });
}

export function findVendor(vendorId) {
  return catalog.find((v) => v.id === vendorId) || null;
}

export function findItem(vendorId, itemId) {
  const vendor = findVendor(vendorId);
  const item = vendor?.items.find((i) => i.id === itemId);
  return vendor && item ? { vendor, item } : null;
}

/** Search item across all vendors (first match). */
export function findItemAnywhere(itemId) {
  for (const vendor of catalog) {
    const item = vendor.items.find((i) => i.id === itemId);
    if (item) return { vendor, item };
  }
  return null;
}

export function searchItems(query) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return [];
  const out = [];
  for (const vendor of catalog) {
    for (const item of vendor.items) {
      if (item.name.toLowerCase().includes(q) || item.id.includes(q)) {
        out.push({ vendorId: vendor.id, vendorName: vendor.name, category: vendor.category, ...item });
      }
    }
  }
  return out;
}

/**
 * Home supplies stock: { [itemId]: number }
 */
export function createSupplies(seed = {}) {
  const stock = {};
  if (seed && typeof seed === "object") {
    for (const [k, v] of Object.entries(seed)) {
      const n = Number(v);
      if (n > 0) stock[k] = Math.floor(n);
    }
  }
  return stock;
}

export function addToSupplies(supplies, itemId, qty = 1) {
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  supplies[itemId] = (supplies[itemId] || 0) + q;
  return supplies[itemId];
}

export function consumeSupply(supplies, itemId, qty = 1) {
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  const have = supplies[itemId] || 0;
  if (have < q) return false;
  supplies[itemId] = have - q;
  if (supplies[itemId] <= 0) delete supplies[itemId];
  return true;
}

export function supplyQty(supplies, itemId) {
  return supplies?.[itemId] || 0;
}

/** Single-item draft order (legacy API). */
export function createOrder(vendorId, itemId, qty = 1) {
  const hit = findItem(vendorId, itemId);
  if (!hit) throw new Error("Unknown commerce item");
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  return {
    orderId: "draft-" + Date.now().toString(36),
    vendorId: hit.vendor.id,
    vendorName: hit.vendor.name,
    category: hit.vendor.category,
    itemId: hit.item.id,
    itemName: hit.item.name,
    qty: q,
    lines: [
      {
        vendorId: hit.vendor.id,
        itemId: hit.item.id,
        itemName: hit.item.name,
        price: hit.item.price,
        qty: q,
        lineTotal: Math.round(hit.item.price * q * 100) / 100
      }
    ],
    total: Math.round(hit.item.price * q * 100) / 100,
    currency: "EUR",
    status: "draft",
    delivery: true,
    requiresConfirmation: true,
    createdAt: Date.now()
  };
}

/**
 * Multi-item draft from a list of item ids (may span vendors — one order per primary vendor group simplified to multi-line).
 * Lines keep vendorId so fulfillment can split later.
 */
export function draftOrderForIngredients(itemIds, { qty = 1 } = {}) {
  const lines = [];
  for (const id of itemIds || []) {
    const hit = findItemAnywhere(id);
    if (!hit) continue;
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    lines.push({
      vendorId: hit.vendor.id,
      itemId: hit.item.id,
      itemName: hit.item.name,
      price: hit.item.price,
      qty: q,
      lineTotal: Math.round(hit.item.price * q * 100) / 100
    });
  }
  if (!lines.length) return null;
  const vendors = [...new Set(lines.map((l) => l.vendorId))];
  return {
    orderId: "draft-" + Date.now().toString(36),
    vendorId: vendors[0],
    vendorName: vendors.length === 1 ? findVendor(vendors[0])?.name : "Multi-vendor",
    vendorIds: vendors,
    category: "mixed",
    lines,
    total: Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
    currency: "EUR",
    status: "draft",
    delivery: true,
    requiresConfirmation: true,
    createdAt: Date.now()
  };
}

export function draftOrderFromLines(lineSpecs) {
  const lines = [];
  for (const spec of lineSpecs || []) {
    const hit = findItemAnywhere(spec.itemId) || (spec.vendorId ? findItem(spec.vendorId, spec.itemId) : null);
    if (!hit) continue;
    const q = Math.max(1, Math.floor(Number(spec.qty) || 1));
    lines.push({
      vendorId: hit.vendor.id,
      itemId: hit.item.id,
      itemName: hit.item.name,
      price: hit.item.price,
      qty: q,
      lineTotal: Math.round(hit.item.price * q * 100) / 100
    });
  }
  if (!lines.length) return null;
  const vendors = [...new Set(lines.map((l) => l.vendorId))];
  return {
    orderId: "draft-" + Date.now().toString(36),
    vendorId: vendors[0],
    vendorName: vendors.length === 1 ? findVendor(vendors[0])?.name : "Multi-vendor",
    vendorIds: vendors,
    category: "mixed",
    lines,
    total: Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
    currency: "EUR",
    status: "draft",
    delivery: true,
    requiresConfirmation: true,
    createdAt: Date.now()
  };
}

export function confirmOrder(order, { eta = "standard", now = Date.now() } = {}) {
  if (!order || order.status !== "draft") return null;
  order.status = "confirmed";
  order.confirmedAt = now;
  const ms = DELIVERY_ETA_MS[eta] || DELIVERY_ETA_MS.standard;
  order.etaMs = ms;
  order.deliverAt = now + ms;
  order.status = "delivering";
  return order;
}

/** Advance delivery; when due, stock supplies and mark delivered. */
export function tickDelivery(order, supplies, now = Date.now()) {
  if (!order || order.status !== "delivering") return order;
  if (now < (order.deliverAt || 0)) return order;
  const lines = order.lines || (order.itemId ? [{ itemId: order.itemId, qty: order.qty || 1 }] : []);
  for (const line of lines) {
    addToSupplies(supplies, line.itemId, line.qty || 1);
  }
  order.status = "delivered";
  order.deliveredAt = now;
  return order;
}

export function cancelOrder(order) {
  if (!order || order.status === "delivered") return false;
  order.status = "cancelled";
  return true;
}

export function createOrderBook(seed = {}) {
  return {
    orders: Array.isArray(seed.orders) ? seed.orders.map((o) => ({ ...o, lines: o.lines ? o.lines.map((l) => ({ ...l })) : o.lines })) : [],
    supplies: createSupplies(seed.supplies)
  };
}

export function placeAndConfirm(book, order, opts = {}) {
  const confirmed = confirmOrder(order, opts);
  if (!confirmed) return null;
  book.orders.push(confirmed);
  return confirmed;
}

/** Process all delivering orders that are due. */
export function tickAllDeliveries(book, now = Date.now()) {
  let n = 0;
  for (const o of book.orders) {
    if (o.status === "delivering") {
      const before = o.status;
      tickDelivery(o, book.supplies, now);
      if (o.status === "delivered" && before !== "delivered") n++;
    }
  }
  return n;
}

export function listOrders(book, status = null) {
  const list = book.orders || [];
  if (!status) return list.map((o) => ({ ...o }));
  return list.filter((o) => o.status === status).map((o) => ({ ...o }));
}

export function summarizeSupplies(supplies) {
  const entries = Object.entries(supplies || {}).filter(([, q]) => q > 0);
  if (!entries.length) return "Empty pantry / bathroom cabinet";
  return entries.map(([id, q]) => `${id}×${q}`).join(", ");
}
