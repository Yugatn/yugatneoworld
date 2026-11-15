import assert from "node:assert/strict";
import {
  createSocialState, sendFriendRequest, acceptFriendRequest,
  getStreetTier, listVisitableFriends, canVisitFriend,
  streetHasFeature, setPresence
} from "../src/domain/social.js";
import {
  createCinemaState, contribute, poolProgress, suggestedContribution,
  coWatchBenefits, selectFilm, endScreening
} from "../src/domain/cinema.js";
import { createApartment, setDoorOpen, canAcceptVisit, isDoorOpen } from "../src/domain/apartment.js";
import { createCityState, buildStreetPlaces } from "../src/domain/city.js";

const apt = createApartment();
assert.equal(isDoorOpen(apt), true);
assert.equal(canAcceptVisit(apt), true);
setDoorOpen(apt, false);
assert.equal(canAcceptVisit(apt), false);
setDoorOpen(apt, true);

const social = createSocialState();
assert.equal(getStreetTier(social).id, "quiet");
assert.equal(streetHasFeature(social, "visits"), false);
assert.equal(streetHasFeature(social, "cinema"), false);

function addConfirmedFriend(id, displayName, doorOpen) {
  const request = sendFriendRequest(social, "local", id);
  assert.equal(request.ok, true);
  const accepted = acceptFriendRequest(social, request.request.id, id);
  assert.equal(accepted.ok, true);
  setPresence(social, id, { status: "online", roomId: "livingRoom", displayName, doorOpen });
}

addConfirmedFriend("u_a", "Alice", true);
assert.equal(getStreetTier(social).id, "neighbors");
assert.ok(streetHasFeature(social, "visits"));
assert.equal(listVisitableFriends(social).length, 1);
assert.equal(canVisitFriend(social, "u_a"), true);

setPresence(social, "u_a", { status: "online", doorOpen: false });
assert.equal(canVisitFriend(social, "u_a"), false);
setPresence(social, "u_a", { status: "online", doorOpen: true });

addConfirmedFriend("u_b", "Bob", true);
addConfirmedFriend("u_c", "Cara", false);
assert.equal(getStreetTier(social).id, "friends");
assert.ok(streetHasFeature(social, "cinema"));
assert.equal(canVisitFriend(social, "u_c"), false);

for (let i = 0; i < 4; i++) {
  addConfirmedFriend("u_x" + i, "F" + i, true);
}
assert.equal(getStreetTier(social).id, "boulevard");
assert.ok(streetHasFeature(social, "premiere"));

const city = createCityState();
const { places, tier } = buildStreetPlaces(city, social);
assert.ok(places.some((p) => p.type === "cinema"));
assert.ok(places.some((p) => p.type === "friend_door"));
assert.ok(!places.some((p) => p.subjectId === "u_c"));
assert.equal(tier.id, "boulevard");

const cinema = createCinemaState();
assert.equal(suggestedContribution(true), 1);
assert.equal(suggestedContribution(false), 2);
const r1 = contribute(cinema, "u1", 2, { isFriendGroup: false, creditsAvailable: 20 });
assert.equal(r1.ok, true);
assert.equal(r1.activated, false);
assert.equal(poolProgress(cinema).total, 2);

let activated = false;
while (!activated && poolProgress(cinema).total < 50) {
  const r = contribute(cinema, "u" + poolProgress(cinema).total, 2, { creditsAvailable: 20 });
  assert.equal(r.ok, true);
  activated = r.activated;
}
assert.equal(cinema.active, true);
assert.ok(coWatchBenefits(3, true).includes("friend discount"));

endScreening(cinema);
assert.equal(cinema.active, false);
assert.ok(selectFilm(cinema, "classic-orbit"));

console.log("social-cinema tests OK");
