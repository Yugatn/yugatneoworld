import assert from "node:assert/strict";
import { createSocialState, getStreetTier, listVisitableFriends, setPresence } from "../src/domain/social.js";
import { createCityState, buildStreetPlaces } from "../src/domain/city.js";

const social = createSocialState();
const city = createCityState();

assert.deepEqual(getStreetTier(social).features, ["services"]);
assert.equal(buildStreetPlaces(city, social).places.some((p) => p.type === "cinema"), false);

social.friendships.push({ key: "alice|local", a: "alice", b: "local" });
assert.ok(getStreetTier(social).features.includes("visits"));
assert.deepEqual(listVisitableFriends(social), []);

setPresence(social, "alice", { status: "online", roomId: "home", displayName: "Alice", doorOpen: true });
assert.equal(listVisitableFriends(social)[0].subjectId, "alice");
assert.equal(buildStreetPlaces(city, social).places.filter((p) => p.type === "friend_door").length, 1);

setPresence(social, "alice", { status: "online", doorOpen: false });
assert.deepEqual(listVisitableFriends(social), []);
assert.equal(buildStreetPlaces(city, social).places.some((p) => p.type === "friend_door"), false);

for (const id of ["bob", "carol"]) {
  const pair = [id, "local"].sort();
  social.friendships.push({ key: pair.join("|"), a: pair[0], b: pair[1] });
}
assert.ok(getStreetTier(social).features.includes("cinema"));
assert.ok(buildStreetPlaces(city, social).places.some((p) => p.type === "cinema"));

for (const id of ["david", "emma", "frank"]) {
  const pair = [id, "local"].sort();
  social.friendships.push({ key: pair.join("|"), a: pair[0], b: pair[1] });
}
assert.ok(getStreetTier(social).features.includes("premiere"));
assert.equal(getStreetTier(social, "unknown").friendCount, 0);
console.log("city street tests OK");
