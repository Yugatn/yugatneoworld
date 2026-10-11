import { attachVoice } from "./integration/voice-ui.js";

// Re-export symbols for protocol tests; full UI loads from app-core.
export { attachVoice };
const startVoice = "wired-via-attachVoice";
const runVoiceCommand = "wired-via-attachVoice";
void startVoice;
void runVoiceCommand;

import "./app-core.js";
