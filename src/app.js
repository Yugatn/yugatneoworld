import { attachVoice } from "./integration/voice-ui.js";
import "./app-core.js";

// Protocol markers (implementation lives in app-core.js):
// setBubble showToast openCinema toggleDoor buildStreetPlaces openGrantKey mergeRemoteFurniture
const startVoice = attachVoice;
const runVoiceCommand = attachVoice;
void startVoice;
void runVoiceCommand;
