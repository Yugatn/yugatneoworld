import assert from "node:assert/strict";
import {
  createSocialState, addFriend, getStreetTier, listVisitableFriends,
  canVisitFriend, streetHasFeature, spendCredits, updateFriendPresence
} from "../src/domain/social.js";
import {
  createCinemaState, contribute, poolProgress, suggestedContribution,
  coWatchBenefits, selectFilm, endScreening, CINEMA_POOL_TARGET
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

addFriend(social, { subjectId: "u_a", displayName: "Alice", doorOpen: true });
assert.equal(getStreetTier(social).id, "neighbors");
assert.ok(streetHasFeature(social, "visits"));
assert.equal(listVisitableFriends(social).length, 1);
assert.equal(canVisitFriend(social, "u_a"), true);

updateFriendPresence(social, "u_a", { doorOpen: false });
assert.equal(canVisitFriend(social, "u_a"), false);
updateFriendPresence(social, "u_a", { doorOpen: true });

addFriend(social, { subjectId: "u_b", displayName: "Bob", doorOpen: true });
addFriend(social, { subjectId: "u_c", displayName: "Cara", doorOpen: false });
assert.equal(getStreetTier(social).id, "friends");
assert.ok(streetHasFeature(social, "cinema"));

for (let i = 0; i < 4; i++) addFriend(social, { subjectId: "u_x" + i, displayName: "F" + i, doorOpen: true });
assert.equal(getStreetTier(social).id, "boulevard");
assert.ok(streetHasFeature(social, "premiere"));

const city = createCityState();
const { places, tier } = buildStreetPlaces(city, social);
assert.ok(places.some((p) => p.type === "cinema"));
assert.ok(places.some((p) => p.type === "friend_door"));
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

assert.equal(spendCredits(social, 5), true);
assert.equal(social.credits, 15);
assert.equal(spendCredits(social, 100), false);

console.log("social-cinema tests OK");
