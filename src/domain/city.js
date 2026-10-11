import { getStreetTier, listVisitableFriends } from "./social.js";

export const CITY_VERSION = "0.2";

const basePlaces = [
  { id: "company-symbiont", type: "employer", name: "Symbiont Network", x: 220, y: 190, description: "Technology and social infrastructure.", jobs: ["job-1", "job-3"] },
  { id: "company-media", type: "employer", name: "Yugatn Media", x: 520, y: 190, description: "Creative production.", jobs: ["job-2"] },
  { id: "education-center", type: "education", name: "Learning Center", x: 820, y: 190, description: "Education and skills development.", jobs: [] },
  { id: "coworking", type: "coworking", name: "City Coworking", x: 220, y: 450, description: "Flexible work space.", jobs: [] },
  { id: "gym", type: "service", name: "Fitness Center", x: 520, y: 450, description: "Health and physical activity.", jobs: [] },
  { id: "yoga", type: "service", name: "Yoga Center", x: 820, y: 450, description: "Movement and recovery.", jobs: [] },
  { id: "cinema", type: "cinema", name: "Street Cinema", x: 520, y: 320, description: "Pool credits with friends to unlock a screening. Co-watching is cheaper.", jobs: [] }
];

export function createCityState() {
  return {
    version: CITY_VERSION,
    places: basePlaces.map((p) => ({ ...p, jobs: [...(p.jobs || [])] }))
  };
}

export function findCityPlace(state, id) {
  return state.places.find((p) => p.id === id);
}

export function nearbyPlaces(state, x, y, r = 180) {
  return state.places.filter((p) => Math.hypot(p.x - x, p.y - y) <= r);
}

/**
 * Street layout: services always; cinema if tier allows; open friend doors as visit targets.
 */
export function buildStreetPlaces(city, social) {
  const tier = getStreetTier(social);
  const places = city.places
    .filter((p) => {
      if (p.type === "cinema") return tier.features.includes("cinema") || tier.features.includes("premiere");
      return true;
    })
    .map((p) => ({ ...p }));

  if (tier.features.includes("visits")) {
    listVisitableFriends(social).forEach((f, i) => {
      places.push({
        id: "friend-door-" + f.subjectId,
        type: "friend_door",
        name: (f.displayName || "Friend") + "'s door",
        x: 150 + (i % 4) * 200,
        y: 520,
        description: "Door is open — you may visit.",
        subjectId: f.subjectId,
        doorOpen: true,
        roomId: f.roomId || null,
        jobs: []
      });
    });
  }
  return { places, tier };
}
