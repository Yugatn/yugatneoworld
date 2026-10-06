export function createSocialState() {
  return {
    friends: [],
    visitors: [],
    pendingVisits: []
  };
}

export function addFriend(state, userId) {
  if (!state.friends.includes(userId)) state.friends.push(userId);
  return state;
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
