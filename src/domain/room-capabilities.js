export const ROOM_CAPABILITIES = {
  kitchen: {
    title: "Kitchen",
    capabilities: [
      { id: "food.delivery", label: "Order food" },
      { id: "cafe.search", label: "Cafes" },
      { id: "restaurant.search", label: "Restaurants" },
      { id: "grocery.search", label: "Grocery stores" }
    ]
  },
  livingRoom: {
    title: "Living room",
    capabilities: [
      { id: "video", label: "Watch video" },
      { id: "music", label: "Listen to music" },
      { id: "inventory", label: "Inventory / furniture" }
    ]
  },
  study: {
    title: "Study",
    capabilities: [
      { id: "messenger", label: "Open Eugene Messenger" },
      { id: "social", label: "Open eWorld social" }
    ]
  },
  bedroom: {
    title: "Bedroom",
    capabilities: [
      { id: "avatar.edit", label: "Change appearance" }
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
