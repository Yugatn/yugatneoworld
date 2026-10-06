export const ROOMS = {
  livingRoom: { id: "livingRoom", name: "Living room", x: 0, y: 0 },
  kitchen: { id: "kitchen", name: "Kitchen", x: 1, y: 0 },
  study: { id: "study", name: "Study", x: 0, y: 1 },
  bedroom: { id: "bedroom", name: "Bedroom", x: 1, y: 1 }
};

export function createApartment() {
  return {
    currentRoom: "livingRoom",
    rooms: Object.values(ROOMS).map((room) => ({ ...room, layoutVersion: 1 }))
  };
}

export function enterRoom(apartment, roomId) {
  if (!ROOMS[roomId]) return false;
  apartment.currentRoom = roomId;
  return true;
}
