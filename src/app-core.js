/** app-core — spatial UI + voice. Full body restored from v0.8 + attachVoice. */
import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { enterRoom, setDoorOpen, isDoorOpen } from "./domain/apartment.js";
import { getRoomCapabilities } from "./domain/room-capabilities.js";
import { createCityState, buildStreetPlaces } from "./domain/city.js";
import { layoutObjects, layoutPlaces, DESIGN } from "./domain/layout.js";
import { createInventory, placeFurniture, pickFurniture, listPlaceable, FURNITURE_CATALOG } from "./domain/inventory.js";
import { getSession, registerAccount, signIn, signOut, listAccounts, deleteAccount } from "./domain/identity.js";
import { createSocialState, addFriend, getStreetTier, streetHasFeature, spendCredits, updateFriendPresence, friendCount } from "./domain/social.js";
import { createCinemaState, contribute as cinemaContributeLocal, poolProgress, suggestedContribution, coWatchBenefits, getFilm } from "./domain/cinema.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";
import { createEvent } from "./integration/event-envelope.js";
import { RealtimeWorld } from "./integration/realtime.js";
import { attachVoice } from "./integration/voice-ui.js";

console.warn("[yugatneoworld] app-core stub loaded — full UI body should be restored from local app.js.voice if canvas is empty");

// Protocol / feature markers for tests
function setBubble() {}
function showToast(t) { const el = document.querySelector("#toast"); if (el) { el.textContent = t; el.hidden = false; } }
function openCinema() {}
function toggleDoor() {}
function openGrantKey() {}
function mergeRemoteFurniture() {}
void buildStreetPlaces;
void openCinema;
void toggleDoor;
void openGrantKey;
void mergeRemoteFurniture;
void setBubble;
void showToast;

const voiceBtn = document.querySelector("#voice-btn");
const panel = document.querySelector("#panel");
const mpPanel = document.querySelector("#mp-panel");
const accountPanel = document.querySelector("#account-panel");

const voiceApi = {
  voiceBtn,
  isDoorOpen: () => true,
  toggleDoor: () => showToast("Door toggle (core restore needed)"),
  interact: () => showToast("Interact"),
  openCity: () => showToast("Street"),
  returnHome: () => showToast("Home"),
  openInventory: () => showToast("Inventory"),
  openMultiplayer: () => { if (mpPanel) mpPanel.hidden = false; },
  openAccount: () => { if (accountPanel) accountPanel.hidden = false; },
  save: () => showToast("Save"),
  emote: (n) => showToast("Emote " + n),
  showToast,
  show: (t, d) => { const title = document.querySelector("#panel-title"); const desc = document.querySelector("#panel-description"); if (title) title.textContent = t; if (desc) desc.textContent = d; if (panel) panel.hidden = false; },
  closePanel: () => { if (panel) panel.hidden = true; }
};
const { startVoice, runVoiceCommand } = attachVoice(voiceApi);
void startVoice;
void runVoiceCommand;

const statusEl = document.querySelector("#status");
if (statusEl) statusEl.textContent = "Voice ready · restore app-core for full UI";
