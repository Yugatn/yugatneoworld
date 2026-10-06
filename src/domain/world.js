export const WORLD_VERSION = 1;

export function createDefaultWorld() {
  return {
    version: WORLD_VERSION,
    avatar: { x: 180, y: 220, appearance: { body: "default", hair: "default", clothes: "casual" } },
    objects: [
      { id: "mailbox", type: "mailbox", name: "Mailbox", x: 130, y: 120, r: 38, capabilities: ["message.read", "message.compose"] },
      { id: "laptop", type: "laptop", name: "Laptop", x: 360, y: 130, r: 42, capabilities: ["messenger", "social"] },
      { id: "tv", type: "tv", name: "Television", x: 620, y: 125, r: 45, capabilities: ["video"] },
      { id: "player", type: "player", name: "Music Player", x: 820, y: 130, r: 42, capabilities: ["music"] },
      { id: "wardrobe", type: "wardrobe", name: "Wardrobe", x: 930, y: 330, r: 45, capabilities: ["avatar.edit"] },
      { id: "door", type: "door", name: "Door", x: 580, y: 500, r: 42, capabilities: ["room.enter"] }
    ]
  };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
