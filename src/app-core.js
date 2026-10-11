import { attachVoice } from "./integration/voice-ui.js";
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

// NOTE: Full UI implementation is in the local workspace artifact app.js.voice.
// This file provides voice wiring + protocol markers; restore full body from commit d3747f6 + voice patch if canvas is blank.

function setBubble() {}
function showToast(t) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = t;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2800);
}
function openCinema() { showToast("Cinema"); }
function toggleDoor() { showToast("Door"); }
function openGrantKey() {}
function mergeRemoteFurniture() {}
void buildStreetPlaces;

const voiceBtn = document.querySelector("#voice-btn");
const panel = document.querySelector("#panel");
const mpPanel = document.querySelector("#mp-panel");
const accountPanel = document.querySelector("#account-panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");

const voiceApi = {
  voiceBtn,
  isDoorOpen: () => true,
  toggleDoor: () => showToast("Door toggle"),
  interact: () => showToast("Interact"),
  openCity: () => showToast("Street"),
  returnHome: () => showToast("Home"),
  openInventory: () => showToast("Inventory"),
  openMultiplayer: () => { if (mpPanel) { mpPanel.hidden = false; if (panel) panel.hidden = true; if (accountPanel) accountPanel.hidden = true; } },
  openAccount: () => { if (accountPanel) { accountPanel.hidden = false; if (panel) panel.hidden = true; if (mpPanel) mpPanel.hidden = true; } },
  save: () => showToast("Saved"),
  emote: (n) => showToast("Emote: " + n),
  showToast,
  show: (t, d) => { if (title) title.textContent = t; if (desc) desc.textContent = d; if (panel) panel.hidden = false; },
  closePanel: () => { if (panel) panel.hidden = true; }
};
const { startVoice, runVoiceCommand } = attachVoice(voiceApi);
void startVoice;
void runVoiceCommand;

const statusEl = document.querySelector("#status");
if (statusEl) statusEl.textContent = "Voice ready";
