export const ROOM_CAPABILITIES = {
  kitchen: {
    title: "Kitchen",
    titleRu: "Кухня",
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
    titleRu: "Гостиная",
    capabilities: [
      { id: "video", label: "Watch video" },
      { id: "music", label: "Listen to music" },
      { id: "inventory", label: "Inventory / furniture" },
      { id: "shop.browse", label: "Shop & delivery" },
      { id: "social.relax", label: "Relax / host guests" },
      { id: "presentation.view", label: "Watch presentation" },
      { id: "presentation.host", label: "Host product pitch" }
    ]
  },
  study: {
    title: "Study",
    titleRu: "Кабинет",
    capabilities: [
      { id: "messenger", label: "Open Eugene Messenger" },
      { id: "social", label: "Open eWorld social" },
      { id: "shop.browse", label: "Shop & delivery" },
      { id: "class.manage", label: "Create / manage classes" },
      { id: "presentation.host", label: "Product presentation" },
      { id: "schedule.view", label: "Schedule" }
    ]
  },
  bedroom: {
    title: "Bedroom",
    titleRu: "Спальня",
    capabilities: [
      { id: "avatar.edit", label: "Change appearance" }
    ]
  },
  bathroom: {
    title: "Bathroom",
    titleRu: "Ванная",
    capabilities: [
      { id: "bathroom.use", label: "Use bathroom" },
      { id: "shop.bathroom", label: "Order bath products" },
      { id: "supplies.view", label: "Cabinet stock" },
      { id: "avatar.shave", label: "Shave" }
    ]
  },
  kidsRoom: {
    title: "Kids room",
    titleRu: "Детская",
    capabilities: [
      { id: "kids.play", label: "Play" },
      { id: "kids.stories", label: "Stories / books" },
      { id: "education", label: "Learning toys" },
      { id: "inventory", label: "Toys & furniture" },
      { id: "schedule.view", label: "Lessons & training calendar" },
      { id: "schedule.edit", label: "Add reminder" },
      { id: "lesson.remind", label: "Due reminders" }
    ]
  },
  workshop: {
    title: "Workshop",
    titleRu: "Мастерская",
    capabilities: [
      { id: "furniture.edit", label: "Edit apartment" },
      { id: "inventory", label: "Open inventory" }
    ]
  }
};

export function getRoomCapabilities(roomId) {
  return ROOM_CAPABILITIES[roomId] ?? null;
}
