import { createApartment } from "./apartment.js";

export const WORLD_VERSION = 2;

export function createDefaultWorld() {
  return {
    version: WORLD_VERSION,
    avatar: { x: 180, y: 220, appearance: { body: "default", hair: "default", clothes: "casual" } },
    apartment: createApartment(),
    objects: [
      { id: "mailbox", roomId: "livingRoom", type: "mailbox", name: "Mailbox", x: 130, y: 120, r: 38, capabilities: ["message.read", "message.compose"] },
      { id: "laptop", roomId: "livingRoom", type: "laptop", name: "Laptop", x: 360, y: 130, r: 42, capabilities: ["messenger", "social"] },
      { id: "tv", roomId: "livingRoom", type: "tv", name: "Television", x: 620, y: 125, r: 45, capabilities: ["video"] },
      { id: "player", roomId: "livingRoom", type: "player", name: "Music Player", x: 820, y: 130, r: 42, capabilities: ["music"] },
      { id: "kitchen", roomId: "livingRoom", type: "door", name: "Kitchen", x: 930, y: 500, r: 42, targetRoom: "kitchen", capabilities: ["room.enter"] },
      { id: "study", roomId: "livingRoom", type: "door", name: "Study", x: 80, y: 500, r: 42, targetRoom: "study", capabilities: ["room.enter"] },
      { id: "bedroom", roomId: "livingRoom", type: "door", name: "Bedroom", x: 500, y: 500, r: 42, targetRoom: "bedroom", capabilities: ["room.enter"] },
      { id: "fridge", roomId: "kitchen", type: "fridge", name: "Refrigerator", x: 170, y: 150, r: 45, capabilities: ["food.delivery", "grocery.search"] },
      { id: "menu-board", roomId: "kitchen", type: "menu", name: "Food Menu", x: 390, y: 150, r: 42, capabilities: ["cafe.search", "restaurant.search"] },
      { id: "phone", roomId: "kitchen", type: "phone", name: "Delivery Phone", x: 650, y: 150, r: 40, capabilities: ["food.delivery"] },
      { id: "pantry", roomId: "kitchen", type: "pantry", name: "Pantry", x: 850, y: 150, r: 42, capabilities: ["grocery.search"] },
      { id: "study-laptop", roomId: "study", type: "laptop", name: "Work Laptop", x: 350, y: 160, r: 42, capabilities: ["messenger", "social"] },
      { id: "study-books", roomId: "study", type: "books", name: "Bookshelf", x: 720, y: 160, r: 42, capabilities: ["books"] },
      { id: "wardrobe", roomId: "bedroom", type: "wardrobe", name: "Wardrobe", x: 300, y: 160, r: 45, capabilities: ["avatar.edit"] },
      { id: "mirror", roomId: "bedroom", type: "mirror", name: "Mirror", x: 650, y: 160, r: 42, capabilities: ["avatar.edit"] }
    ]
  };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
