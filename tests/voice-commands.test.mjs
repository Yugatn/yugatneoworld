import assert from "node:assert/strict";
import { matchVoiceCommand, listVoiceHelp, VOICE_COMMANDS, speechRecognitionSupported } from "../src/domain/voice-commands.js";

assert.equal(matchVoiceCommand("open door").id, "door.open");
assert.equal(matchVoiceCommand("открой дверь").id, "door.open");
assert.equal(matchVoiceCommand("закрой дверь").id, "door.close");
assert.equal(matchVoiceCommand("close door").id, "door.close");
assert.equal(matchVoiceCommand("на улицу").id, "street");
assert.equal(matchVoiceCommand("go to street").id, "street");
assert.equal(matchVoiceCommand("домой").id, "home");
assert.equal(matchVoiceCommand("inventory").id, "inventory");
assert.equal(matchVoiceCommand("инвентарь").id, "inventory");
assert.equal(matchVoiceCommand("мультиплеер").id, "multiplayer");
assert.equal(matchVoiceCommand("wave").id, "emote.wave");
assert.equal(matchVoiceCommand("помощь").id, "help");
assert.equal(matchVoiceCommand(""), null);
assert.equal(matchVoiceCommand("asdfghjkl xyz"), null);

// Smart home
assert.equal(matchVoiceCommand("smart home").id, "smarthome.panel");
assert.equal(matchVoiceCommand("умный дом").id, "smarthome.panel");
assert.equal(matchVoiceCommand("lights on").id, "lights.on");
assert.equal(matchVoiceCommand("включи свет").id, "lights.on");
assert.equal(matchVoiceCommand("выключи свет").id, "lights.off");
assert.equal(matchVoiceCommand("lights off").id, "lights.off");
assert.equal(matchVoiceCommand("теплее").id, "climate.warmer");
assert.equal(matchVoiceCommand("холоднее").id, "climate.cooler");
assert.equal(matchVoiceCommand("телевизор").id, "tv.toggle");
assert.equal(matchVoiceCommand("музыка").id, "music.toggle");

// Avatar
assert.equal(matchVoiceCommand("wardrobe").id, "avatar.wardrobe");
assert.equal(matchVoiceCommand("одежда").id, "avatar.wardrobe");
assert.equal(matchVoiceCommand("шкаф").id, "avatar.wardrobe");
assert.equal(matchVoiceCommand("appearance").id, "avatar.appearance");
assert.equal(matchVoiceCommand("внешность").id, "avatar.appearance");
assert.equal(matchVoiceCommand("shave").id, "avatar.shave");
assert.equal(matchVoiceCommand("побриться").id, "avatar.shave");

// Rooms / shop / recipes
assert.equal(matchVoiceCommand("bathroom").id, "room.bathroom");
assert.equal(matchVoiceCommand("ванная").id, "room.bathroom");
assert.equal(matchVoiceCommand("kitchen").id, "room.kitchen");
assert.equal(matchVoiceCommand("кухня").id, "room.kitchen");
assert.equal(matchVoiceCommand("гостиная").id, "room.living");
assert.equal(matchVoiceCommand("living room").id, "room.living");
assert.equal(matchVoiceCommand("детская").id, "room.kids");
assert.equal(matchVoiceCommand("kids room").id, "room.kids");
assert.equal(matchVoiceCommand("спальня").id, "room.bedroom");
assert.equal(matchVoiceCommand("кабинет").id, "room.study");
assert.equal(matchVoiceCommand("доставка").id, "shop.open");
assert.equal(matchVoiceCommand("шампунь").id, "shop.bathroom");
assert.equal(matchVoiceCommand("рецепты").id, "recipe.list");
assert.equal(matchVoiceCommand("принять душ").id, "bathroom.shower");
assert.equal(matchVoiceCommand("take a bath").id, "bathroom.bath");

assert.ok(listVoiceHelp().length >= VOICE_COMMANDS.length - 1);
assert.equal(speechRecognitionSupported(), false);

console.log("voice-commands tests OK");
