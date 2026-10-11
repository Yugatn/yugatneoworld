/** Friends, visits, and street tiers driven by contact count. */

export const STREET_TIERS = [
  { id: "quiet", name: "Quiet lane", minFriends: 0, maxFriends: 0, features: ["services"] },
  { id: "neighbors", name: "Neighbors street", minFriends: 1, maxFriends: 2, features: ["services", "visits"] },
  { id: "friends", name: "Friends avenue", minFriends: 3, maxFriends: 5, features: ["services", "visits", "cinema"] },
  { id: "boulevard", name: "Social boulevard", minFriends: 6, maxFriends: Infinity, features: ["services", "visits", "cinema", "premiere"] }
];

export function createSocialState(seed = {}) {
  return {
    friends: Array.isArray(seed.friends) ? seed.friends.map((f) => ({ ...f })) : [],
    visitors: Array.isArray(seed.visitors) ? [...seed.visitors] : [],
    pendingVisits: Array.isArray(seed.pendingVisits) ? [...seed.pendingVisits] : [],
    /** Symbolic local credits for cinema pool and small purchases. */
    credits: Number.isFinite(seed.credits) ? seed.credits : 20
  };
}

export function addFriend(state, entry) {
  const subjectId = typeof entry === "string" ? entry : entry.subjectId;
  if (!subjectId) return state;
  if (state.friends.some((f) => f.subjectId === subjectId || f === subjectId)) return state;
  const friend = typeof entry === "string"
    ? { subjectId, displayName: subjectId.slice(0, 12), doorOpen: false, roomId: null }
    : {
        subjectId,
        displayName: String(entry.displayName || subjectId).slice(0, 24),
        doorOpen: Boolean(entry.doorOpen),
        roomId: entry.roomId || null
      };
  state.friends.push(friend);
  return state;
}

export function removeFriend(state, subjectId) {
  state.friends = state.friends.filter((f) => (f.subjectId || f) !== subjectId);
  return state;
}

export function updateFriendPresence(state, subjectId, patch = {}) {
  const friend = state.friends.find((f) => f.subjectId === subjectId);
  if (!friend) return null;
  if (patch.displayName != null) friend.displayName = String(patch.displayName).slice(0, 24);
  if (patch.doorOpen != null) friend.doorOpen = Boolean(patch.doorOpen);
  if (patch.roomId != null) friend.roomId = patch.roomId;
  return friend;
}

export function friendCount(state) {
  return state.friends.length;
}

export function getStreetTier(stateOrCount) {
  const n = typeof stateOrCount === "number" ? stateOrCount : friendCount(stateOrCount);
  for (let i = STREET_TIERS.length - 1; i >= 0; i--) {
    if (n >= STREET_TIERS[i].minFriends) return STREET_TIERS[i];
  }
  return STREET_TIERS[0];
}

export function streetHasFeature(state, feature) {
  return getStreetTier(state).features.includes(feature);
}

/** Friends who currently have an open door (visitable from the street). */
export function listVisitableFriends(state) {
  return state.friends.filter((f) => f.doorOpen);
}

export function canVisitFriend(state, subjectId) {
  if (!streetHasFeature(state, "visits")) return false;
  const friend = state.friends.find((f) => f.subjectId === subjectId);
  return Boolean(friend && friend.doorOpen);
}

export function requestVisit(state, userId) {
  if (!state.pendingVisits.includes(userId)) state.pendingVisits.push(userId);
  return state;
}

export function authorizeVisit(state, userId) {
  state.pendingVisits = state.pendingVisits.filter((id) => id !== userId);
  if (!state.visitors.includes(userId)) state.visitors.push(userId);
  return state;
}

export function endVisit(state, userId) {
  state.visitors = state.visitors.filter((id) => id !== userId);
  return state;
}

export function spendCredits(state, amount) {
  const n = Math.max(0, Number(amount) || 0);
  if (state.credits < n) return false;
  state.credits -= n;
  return true;
}

export function addCredits(state, amount) {
  state.credits += Math.max(0, Number(amount) || 0);
  return state.credits;
}
