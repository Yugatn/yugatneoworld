export const PRESENCE_MODES = {
  HOME: "home",
  STREET: "street",
  TRAVEL: "travel",
  SCHOOL: "school",
  CUSTOM: "custom"
};

export function setPresenceMode(state, mode) {
  if (!Object.values(PRESENCE_MODES).includes(mode)) {
    throw new Error("Unknown presence mode");
  }
  state.presenceMode = mode;
  return state;
}

export function getStreetCapabilities() {
  return [
    { id: "transit.stop", label: "Bus / tram stop" },
    { id: "city.map", label: "City map" },
    { id: "gym", label: "Gym" },
    { id: "yoga", label: "Yoga centre" },
    { id: "education", label: "Education" },
    { id: "school.enter", label: "School mode" },
    { id: "cafe.search", label: "Cafes" },
    { id: "restaurant.search", label: "Restaurants" },
    { id: "shops", label: "Shops" }
  ];
}
