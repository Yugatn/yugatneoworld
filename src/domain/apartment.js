export const ROOMS = {
  livingRoom: { id: "livingRoom", name: "Living room", x: 0, y: 0 },
  kitchen: { id: "kitchen", name: "Kitchen", x: 1, y: 0 },
  study: { id: "study", name: "Study", x: 0, y: 1 },
  bedroom: { id: "bedroom", name: "Bedroom", x: 1, y: 1 }
};

export function createApartment() {
  return {
    currentRoom: "livingRoom",
    /** When true, friends on the street can request a visit. */
    doorOpen: true,
    rooms: Object.values(ROOMS).map((room) => ({ ...room, layoutVersion: 1 }))
  };
}

export function enterRoom(apartment, roomId) {
  if (!ROOMS[roomId]) return false;
  apartment.currentRoom = roomId;
  return true;
}

export function setDoorOpen(apartment, open) {
  apartment.doorOpen = Boolean(open);
  return apartment.doorOpen;
}

export function isDoorOpen(apartment) {
  return apartment?.doorOpen !== false;
}

/** Guests may only enter if the host door is open. */
export function canAcceptVisit(apartment) {
  return isDoorOpen(apartment);
}
