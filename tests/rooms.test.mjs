import assert from "node:assert/strict";
import {
  ROOMS,
  createApartment,
  enterRoom,
  listRooms,
  roomDisplayName
} from "../src/domain/apartment.js";
import { getRoomCapabilities } from "../src/domain/room-capabilities.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { createSmartHome, LIGHT_ROOMS, isLightOn } from "../src/domain/smart-home.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.equal(WORLD_VERSION, 8);
assert.ok(ROOMS.livingRoom);
assert.equal(ROOMS.livingRoom.nameRu, "Гостиная");
assert.ok(ROOMS.kidsRoom);
assert.equal(ROOMS.kidsRoom.nameRu, "Детская");
assert.equal(roomDisplayName("livingRoom", "ru"), "Гостиная");
assert.equal(roomDisplayName("kidsRoom", "ru"), "Детская");
assert.ok(listRooms().length >= 6);

const apt = createApartment();
assert.equal(apt.currentRoom, "livingRoom");
assert.ok(enterRoom(apt, "kidsRoom"));
assert.equal(apt.currentRoom, "kidsRoom");
assert.equal(enterRoom(apt, "nope"), false);

const caps = getRoomCapabilities("kidsRoom");
assert.ok(caps);
assert.ok(caps.capabilities.some((c) => c.id === "kids.play"));
assert.equal(getRoomCapabilities("livingRoom").titleRu, "Гостиная");

const world = createDefaultWorld();
assert.ok(world.objects.some((o) => o.roomId === "kidsRoom" && o.id === "toy-box"));
assert.ok(world.objects.some((o) => o.id === "kids-door" && o.targetRoom === "kidsRoom"));
assert.ok(world.objects.some((o) => o.id === "sofa" && o.roomId === "livingRoom"));

const sh = createSmartHome();
assert.ok(LIGHT_ROOMS.includes("kidsRoom"));
assert.ok(LIGHT_ROOMS.includes("livingRoom"));
assert.ok(isLightOn(sh, "kidsRoom"));

assert.equal(matchVoiceCommand("гостиная").id, "room.living");
assert.equal(matchVoiceCommand("детская").id, "room.kids");
assert.equal(matchVoiceCommand("kids room").id, "room.kids");
assert.equal(matchVoiceCommand("living room").id, "room.living");

console.log("rooms tests OK");
