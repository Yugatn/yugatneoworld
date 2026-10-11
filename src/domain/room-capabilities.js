export const ROOM_CAPABILITIES = {
  kitchen: {
    title: "Kitchen",
    capabilities: [
      { id: "food.delivery", label: "Order food" },
      { id: "cafe.search", label: "Cafes" },
      { id: "restaurant.search", label: "Restaurants" },
      { id: "grocery.search", label: "Grocery stores" },
      { id: "recipe.list", label: "Recipe book" },
      { id: "recipe.order", label: "Order recipe ingredients" },
      { id: "supplies.view", label: "Pantry stock" }
    ]
  },
  livingRoom: {
    title: "Living room",
    capabilities: [
      { id: "video", label: "Watch video" },
      { id: "music", label: "Listen to music" },
      { id: "inventory", label: "Inventory / furniture" },
      { id: "shop.browse", label: "Shop & delivery" }
    ]
  },
  study: {
    title: "Study",
    capabilities: [
      { id: "messenger", label: "Open Eugene Messenger" },
      { id: "social", label: "Open eWorld social" },
      { id: "shop.browse", label: "Shop & delivery" }
    ]
  },
  bedroom: {
    title: "Bedroom",
    capabilities: [
      { id: "avatar.edit", label: "Change appearance" }
    ]
  },
  bathroom: {
    title: "Bathroom",
    capabilities: [
      { id: "bathroom.use", label: "Use bathroom" },
      { id: "shop.bathroom", label: "Order bath products" },
      { id: "supplies.view", label: "Cabinet stock" },
      { id: "avatar.shave", label: "Shave" }
    ]
  },
  workshop: {
    title: "Workshop",
    capabilities: [
      { id: "furniture.edit", label: "Edit apartment" },
      { id: "inventory", label: "Open inventory" }
    ]
  }
};

export function getRoomCapabilities(roomId) {
  return ROOM_CAPABILITIES[roomId] ?? null;
}
