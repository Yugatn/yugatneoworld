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
import {
  createSmartHome, toggleLight, setAllLights, adjustTemp, toggleTv, toggleMusic,
  summarize as summarizeSmartHome, listDevices, roomLightFactor
} from "./domain/smart-home.js";
import {
  createAvatarState, equip, listWardrobe, summarizeAvatar, shaveAtHome,
  haircutAtBarber, getEffectiveAppearance, toLegacyAppearance, CLOTHING_CATALOG
} from "./domain/avatar.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";
import { createEvent } from "./integration/event-envelope.js";
import { RealtimeWorld } from "./integration/realtime.js";

// NOTE: Full spatial UI body still pending restore; this file wires domain APIs + protocol markers.

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
void distance;
void roomLightFactor;
void listDevices;
void haircutAtBarber;
void CLOTHING_CATALOG;

let world = typeof localStorage !== "undefined" ? loadWorld() : createDefaultWorld();
if (!world.smartHome) world.smartHome = createSmartHome();
if (!world.avatarState) world.avatarState = createAvatarState();

function syncAppearance() {
  world.avatar = world.avatar || {};
  world.avatar.appearance = toLegacyAppearance(world.avatarState);
}

function openSmartHome() {
  const lines = listDevices(world.smartHome, world.apartment?.currentRoom || "livingRoom")
    .map((d) => d.label + ": " + d.status);
  show("🏠 Smart Home", summarizeSmartHome(world.smartHome) + " · " + lines.slice(0, 4).join("; "), [
    ["Close", () => closePanel()]
  ]);
}

function smartHomeLights(on) {
  setAllLights(world.smartHome, on);
  showToast(on ? "Lights on" : "Lights off");
  try { saveWorld(world); } catch {}
}

function smartHomeToggleLight() {
  const room = world.apartment?.currentRoom || "livingRoom";
  const on = toggleLight(world.smartHome, room);
  showToast(on ? "Light on" : "Light off");
  try { saveWorld(world); } catch {}
}

function smartHomeAdjustTemp(delta) {
  adjustTemp(world.smartHome, delta);
  showToast(world.smartHome.climate.targetC + "°C");
  try { saveWorld(world); } catch {}
}

function smartHomeToggleTv() {
  const on = toggleTv(world.smartHome);
  showToast(on ? "TV on" : "TV off");
  try { saveWorld(world); } catch {}
}

function smartHomeToggleMusic() {
  const on = toggleMusic(world.smartHome);
  showToast(on ? "Music on" : "Music off");
  try { saveWorld(world); } catch {}
}

function openWardrobe() {
  const by = listWardrobe(world.avatarState);
  const lines = [];
  for (const slot of ["top", "bottom", "shoes", "accessory"]) {
    const items = by[slot] || [];
    if (!items.length) continue;
    lines.push(slot + ": " + items.map((i) => (i.equipped ? "[" + i.name + "]" : i.name)).join(", "));
  }
  show("👗 Wardrobe", lines.join(" · ") || "Empty wardrobe", [["Close", () => closePanel()]]);
}

function showAppearance() {
  show("🪞 Appearance", summarizeAvatar(world.avatarState), [["Close", () => closePanel()]]);
}

function doShave() {
  const r = shaveAtHome(world.avatarState);
  syncAppearance();
  showToast(r.message);
  try { saveWorld(world); } catch {}
}

const voiceBtn = document.querySelector("#voice-btn");
const panel = document.querySelector("#panel");
const mpPanel = document.querySelector("#mp-panel");
const accountPanel = document.querySelector("#account-panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");

function show(t, d, _actions) {
  if (title) title.textContent = t;
  if (desc) desc.textContent = d;
  if (panel) panel.hidden = false;
}
function closePanel() {
  if (panel) panel.hidden = true;
}

const voiceApi = {
  voiceBtn,
  isDoorOpen: () => isDoorOpen(world.apartment),
  toggleDoor: () => {
    setDoorOpen(world.apartment, !isDoorOpen(world.apartment));
    showToast(isDoorOpen(world.apartment) ? "Door open" : "Door closed");
  },
  interact: () => showToast("Interact"),
  openCity: () => showToast("Street"),
  returnHome: () => showToast("Home"),
  openInventory: () => showToast("Inventory"),
  openMultiplayer: () => { if (mpPanel) { mpPanel.hidden = false; if (panel) panel.hidden = true; if (accountPanel) accountPanel.hidden = true; } },
  openAccount: () => { if (accountPanel) { accountPanel.hidden = false; if (panel) panel.hidden = true; if (mpPanel) mpPanel.hidden = true; } },
  save: () => { saveWorld(world); showToast("Saved"); },
  emote: (n) => showToast("Emote: " + n),
  showToast,
  show,
  closePanel,
  openSmartHome,
  smartHomeLights,
  smartHomeToggleLight,
  smartHomeAdjustTemp,
  smartHomeToggleTv,
  smartHomeToggleMusic,
  openWardrobe,
  showAppearance,
  doShave
};
const { startVoice, runVoiceCommand } = attachVoice(voiceApi);
void startVoice;
void runVoiceCommand;
void equip;
void getEffectiveAppearance;

const statusEl = document.querySelector("#status");
if (statusEl) statusEl.textContent = "Voice + Smart Home + Avatar ready";
