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

assert.ok(listVoiceHelp().length >= VOICE_COMMANDS.length - 1);
assert.equal(speechRecognitionSupported(), false);

console.log("voice-commands tests OK");
