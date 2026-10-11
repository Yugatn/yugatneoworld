import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { enterRoom, setDoorOpen, isDoorOpen } from "./domain/apartment.js";
import { getRoomCapabilities } from "./domain/room-capabilities.js";
import { createCityState, buildStreetPlaces } from "./domain/city.js";
import { layoutObjects, layoutPlaces, DESIGN } from "./domain/layout.js";
import { createInventory, placeFurniture, pickFurniture, listPlaceable, FURNITURE_CATALOG } from "./domain/inventory.js";
import { getSession, registerAccount, signIn, signOut, listAccounts, deleteAccount, updateSessionProfile } from "./domain/identity.js";
import { createSocialState, addFriend, getStreetTier, streetHasFeature, spendCredits, updateFriendPresence, friendCount } from "./domain/social.js";
import { createCinemaState, contribute as cinemaContributeLocal, poolProgress, suggestedContribution, coWatchBenefits, getFilm } from "./domain/cinema.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";
import { createEvent } from "./integration/event-envelope.js";
import { RealtimeWorld } from "./integration/realtime.js";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const panel = document.querySelector("#panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");
const actions = document.querySelector("#panel-actions");
const statusEl = document.querySelector("#status");
const presenceEl = document.querySelector("#presence");
const mpPanel = document.querySelector("#mp-panel");
const mpName = document.querySelector("#mp-name");
const mpRoom = document.querySelector("#mp-room");
const mpPlayers = document.querySelector("#mp-players");
const chatLog = document.querySelector("#chat-log");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystick-knob");
const interactBtn = document.querySelector("#interact-btn");
const accountPanel = document.querySelector("#account-panel");
const accountName = document.querySelector("#account-name");
const accountStatus = document.querySelector("#account-status");
const accountList = document.querySelector("#account-list");
const roomLabelEl = document.querySelector("#room-label");
const toastEl = document.querySelector("#toast");

const ROOM_KEY = "yugatn-eworld-room-v1";
const SOCIAL_KEY = "eworld.social.v1";
const session = getSession();
const params = new URLSearchParams(location.search);
const initialRoom = params.get("room") || localStorage.getItem(ROOM_KEY) || "apartment:demo";
const initialName = session.displayName || "Guest";
const world = loadWorld(createDefaultWorld());
if (!world.apartment) world.apartment = createDefaultWorld().apartment;
if (world.apartment.doorOpen == null) world.apartment.doorOpen = true;
if (!Array.isArray(world.inventory)) world.inventory = createInventory();
function loadSocial() {
  try { const raw = localStorage.getItem(SOCIAL_KEY); if (raw) return createSocialState(JSON.parse(raw)); } catch {}
  return createSocialState();
}
function saveSocial() { try { localStorage.setItem(SOCIAL_KEY, JSON.stringify(social)); } catch {} }
const social = loadSocial();
let cinemaLocal = createCinemaState();
const city = createCityState();
const keys = new Set();
const eugene = new EugeneMessengerAdapter();
const symbiont = new SymbiontEventAdapter();
const realtime = new RealtimeWorld({ roomId: initialRoom, profile: { name: initialName, avatar: session.avatar || "default" } });
realtime.doorOpen = isDoorOpen(world.apartment);
if (accountName) accountName.value = initialName;
if (mpName) mpName.value = initialName;
if (mpRoom) mpRoom.value = initialRoom;

let pointerId = null, lastMoveAt = 0, lastNetworkMoveAt = 0, scene = "apartment";
let joyVec = { x: 0, y: 0 }, joyActive = false;
const labels = { mailbox:"📮",laptop:"💻",tv:"📺",player:"🎵",wardrobe:"👕",door:"🚪",fridge:"🧊",menu:"🍽",phone:"📱",pantry:"🛒",books:"📚",mirror:"🪞",portal:"🌆",furniture:"🪑",decoration:"🪴",chair:"🪑",plant:"🪴",table:"🪵",lamp:"💡" };
const EMOTES = { wave:"👋", heart:"❤️", clap:"👏", think:"💭", hello:"💬" };
const bubbles = new Map();

function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function updateRoomLabel() {
  if (!roomLabelEl) return;
  if (scene === "street") roomLabelEl.textContent = getStreetTier(social).name;
  else roomLabelEl.textContent = (isDoorOpen(world.apartment) ? "🔓 " : "🔒 ") + (world.apartment.rooms.find(r => r.id === world.apartment.currentRoom)?.name || "Apartment");
}
function showToast(text, ms = 2800) {
  if (!toastEl) return;
  toastEl.textContent = text; toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.hidden = true; }, ms);
}
function setBubble(id, text, ms = 2500) { bubbles.set(id, { text, until: performance.now() + ms }); }
function objectLabel(o) { return o.label || labels[o.subtype] || labels[o.type] || "◈"; }
function designFromScreen(sx, sy) {
  const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
  return { x: (sx / w) * DESIGN.width, y: (sy / h) * DESIGN.height };
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, String.fromCharCode(38) + "amp;")
    .replace(/</g, String.fromCharCode(38) + "lt;")
    .replace(/>/g, String.fromCharCode(38) + "gt;")
    .replace(/"/g, String.fromCharCode(38) + "quot;")
    .replace(/'/g, String.fromCharCode(38) + "#39;");
}
function publish(type, payload = {}, context = {}) {
  symbiont.publish(createEvent(type, payload, { ...context, worldId: "local-world", apartmentId: "local-apartment" }));
}
function show(t, d, buttons = []) {
  title.textContent = t; desc.textContent = d; actions.innerHTML = "";
  for (const [label, fn] of buttons) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = fn; actions.appendChild(b);
  }
  panel.hidden = false; if (mpPanel) mpPanel.hidden = true; if (accountPanel) accountPanel.hidden = true;
}
function toggleDoor() {
  const open = !isDoorOpen(world.apartment);
  setDoorOpen(world.apartment, open);
  saveWorld(world);
  realtime.setDoorOpen(open);
  updateRoomLabel();
  showToast(open ? "Door open — friends may visit" : "Door closed — no visits");
}
function openCinema() {
  if (!streetHasFeature(social, "cinema") && !streetHasFeature(social, "premiere")) {
    show("🎬 Cinema", "Invite more friends (3+) to unlock the street cinema.", [["Back", () => { panel.hidden = true; }]]);
    return;
  }
  const isFriendGroup = friendCount(social) >= 1;
  const amount = suggestedContribution(isFriendGroup);
  const remote = realtime.cinema;
  const progress = remote
    ? { total: remote.total || 0, target: remote.target || 10, remaining: Math.max(0, (remote.target || 10) - (remote.total || 0)) }
    : poolProgress(cinemaLocal);
  const film = getFilm((remote && remote.filmId) || cinemaLocal.filmId);
  const benefits = coWatchBenefits(Math.max(1, (remote && remote.viewers && remote.viewers.length) || 1), isFriendGroup);
  const buttons = [];
  if (remote && remote.active) {
    buttons.push(["Join screening", () => { realtime.cinemaJoin(); showToast("Watching " + film.title + " together"); panel.hidden = true; }]);
  } else {
    buttons.push(["Contribute " + amount + " credits", () => {
      if (!spendCredits(social, amount)) {
        show("🎬 Cinema", "Not enough credits (have " + social.credits + ").", [["Back", () => openCinema()]]);
        return;
      }
      saveSocial();
      realtime.cinemaContribute(amount, film.id);
      const local = cinemaContributeLocal(cinemaLocal, realtime.id || "local", amount, { isFriendGroup, creditsAvailable: 999 });
      if (local.activated) showToast("Screening unlocked: " + film.title);
      else showToast("Pooled " + amount + " · " + (local.progress?.remaining ?? "?") + " left");
      openCinema();
    }]);
  }
  buttons.push(["Back to street", () => { panel.hidden = true; }]);
  const status = (remote && remote.active)
    ? "Screening active — join your friends."
    : ("Pool " + progress.total + " / " + progress.target + " · your credits: " + social.credits);
  show("🎬 " + film.title, status + " Benefits: " + (benefits.join(", ") || "solo rate") + ".", buttons);
}
function openWork() {
  show("💼 STNetwork", "One employment identity, two interfaces.", [
    ["Classic work interface", () => { location.href = "src/classic/work.html"; }],
    ["Employer directory", () => { location.href = "src/classic/employer.html"; }],
    ["Resume", () => { location.href = "src/classic/work.html"; }]
  ]);
  publish("employment.interface.opened");
}
function openCity() {
  scene = "street"; panel.hidden = true;
  for (const u of realtime.users.values()) {
    if (social.friends.some(f => f.subjectId === u.id)) {
      updateFriendPresence(social, u.id, { displayName: u.profile?.name, doorOpen: u.doorOpen !== false, roomId: realtime.roomId });
    }
  }
  saveSocial();
  const tier = getStreetTier(social);
  showToast(tier.name + " · " + friendCount(social) + " friends");
  realtime.changeScene("street", world.avatar.x, world.avatar.y);
  updateRoomLabel();
  publish("street.entered", { tier: tier.id, friends: friendCount(social) });
}
function returnApartment() {
  scene = "apartment"; panel.hidden = true;
  realtime.changeScene("apartment", world.avatar.x, world.avatar.y);
  updateRoomLabel();
  publish("apartment.entered");
}
function openPlace(p) {
  const buttons = [];
  if (p.type === "friend_door") {
    if (!p.doorOpen || !streetHasFeature(social, "visits")) {
      show("🚪 " + p.name, p.doorOpen ? "Add friends to unlock visits." : "The door is closed.", [["Back to street", () => { panel.hidden = true; }]]);
      return;
    }
    buttons.push(["Visit (door is open)", () => { realtime.requestVisit(p.subjectId); showToast("Visit requested…"); panel.hidden = true; }]);
    buttons.push(["Back to street", () => { panel.hidden = true; }]);
    show("🚪 " + p.name, p.description || "Open door — you may visit.", buttons);
    return;
  }
  if (p.type === "cinema") { openCinema(); return; }
  if (p.type === "employer") {
    buttons.push(
      ["Enter company", () => { publish("company.entered", { placeId: p.id }); location.href = "src/classic/company.html?id=" + encodeURIComponent(p.id); }],
      ["View vacancies", () => { location.href = "src/classic/work.html"; }],
      ["Contact via Eugene", () => { publish("employer.contact.requested", { placeId: p.id }); show("Eugene", "Employer conversation requested."); }]
    );
  } else if (p.type === "education") buttons.push(["Open learning", () => show(p.name, p.description)]);
  else buttons.push(["Open service", () => show(p.name, p.description)]);
  buttons.push(["Back to street", () => { panel.hidden = true; }]);
  show("🏢 " + p.name, p.description, buttons);
  publish("city.place.opened", { placeId: p.id, placeType: p.type });
}
function openInventory() {
  const items = listPlaceable(world.inventory);
  if (!items.length) {
    show("📦 Inventory", "No placeable items.", [["Close", () => { panel.hidden = true; }]]);
    return;
  }
  const buttons = items.map(item => {
    const cat = FURNITURE_CATALOG[item.id];
    return [((cat && cat.label) || "◈") + " Place " + item.name, () => {
      const pos = designFromScreen(world.avatar.x + 50, world.avatar.y);
      const obj = placeFurniture(world, world.inventory, item.id, world.apartment.currentRoom, pos.x, pos.y);
      if (obj) { saveWorld(world); showToast("Placed " + obj.name); panel.hidden = true; }
    }];
  });
  buttons.push(["Close", () => { panel.hidden = true; }]);
  show("📦 Inventory", "Place near you.", buttons);
}
function objects() { return layoutObjects(world.objects, world.apartment.currentRoom, canvas.clientWidth, canvas.clientHeight); }
function nearest() {
  let b = null, bd = Infinity;
  for (const o of objects()) { const d = distance(world.avatar, o); if (d < o.r + 28 && d < bd) { b = o; bd = d; } }
  return b;
}
function interact() {
  if (scene === "street") {
    const built = buildStreetPlaces(city, social);
    const places = layoutPlaces(built.places, canvas.clientWidth, canvas.clientHeight);
    const p = places.find(pl => Math.hypot(pl.x - world.avatar.x, pl.y - world.avatar.y) < 90);
    if (p) return openPlace(p); return;
  }
  const o = nearest();
  if (!o) { openRoomCapabilities(); return; }
  if (o.type === "portal") { openCity(); return; }
  const buttons = (o.capabilities || []).map(c => [c, () => runCapability(o, c)]);
  buttons.push(["💼 STNetwork", openWork]);
  for (const u of realtime.users.values()) {
    if ((u.scene || "apartment") !== scene) continue;
    buttons.push(["Invite " + (u.profile?.name || "user"), () => realtime.invite(u.id)]);
  }
  show(objectLabel(o) + " " + o.name, "A spatial capability.", buttons);
}
async function runCapability(o, c) {
  if (c === "room.enter") {
    enterRoom(world.apartment, o.targetRoom);
    world.avatar.x = Math.min(canvas.clientWidth - 45, 180);
    world.avatar.y = Math.min(canvas.clientHeight - 45, 350);
    panel.hidden = true; saveWorld(world); updateRoomLabel(); return;
  }
  if (c === "employment" || c === "jobs" || c === "resume") return openWork();
  if (c === "message.read" || c === "message.compose") {
    await eugene.listConversations?.();
    show("Eugene Messenger", "Adapter ready; external transport not configured."); return;
  }
  if (c === "avatar.edit") {
    world.avatar.appearance.clothes = world.avatar.appearance.clothes === "casual" ? "formal" : "casual";
    saveWorld(world); show("👕 Avatar", "Outfit: " + world.avatar.appearance.clothes); return;
  }
  if (c === "furniture.pick") {
    const picked = pickFurniture(world, world.inventory, o.id);
    if (picked) { saveWorld(world); showToast("Picked up " + picked.name); panel.hidden = true; }
    return;
  }
  show(objectLabel(o) + " " + o.name, "Capability " + c);
}
function openRoomCapabilities() {
  const r = getRoomCapabilities(world.apartment.currentRoom); if (!r) return;
  const buttons = r.capabilities.map(c => [c.label, () => {
    if (["employment", "work", "jobs", "resume"].includes(c.id)) openWork();
    else if (c.id === "furniture.edit" || c.id === "inventory") openInventory();
    else show("Capability", c.label);
  }]);
  buttons.push([isDoorOpen(world.apartment) ? "🔒 Close door (no visits)" : "🔓 Open door (allow visits)", () => { toggleDoor(); panel.hidden = true; }]);
  buttons.push(["📦 Inventory / furniture", openInventory]);
  buttons.push(["💼 STNetwork", openWork]);
  show("🏠 " + r.title, "Credits: " + social.credits, buttons);
}
function updatePresence() {
  if (presenceEl) { const n = 1 + realtime.users.size; presenceEl.textContent = String(n); }
  if (!mpPlayers) return;
  const rows = [`<li><span class="dot" style="background:${realtime.color || "#b9d7ff"}"></span>You · ${escapeHtml(realtime.profile.name)}</li>`];
  for (const u of realtime.users.values()) {
    rows.push(`<li><span class="dot" style="background:${u.color || "#f1a6cf"}"></span>${escapeHtml(u.profile?.name || "Guest")}${u.doorOpen === false ? " 🔒" : " 🔓"}<span class="acct-actions"><button type="button" data-invite="${u.id}" class="ghost">Invite</button><button type="button" data-friend="${u.id}" data-friend-name="${escapeHtml(u.profile?.name || "Guest")}" class="ghost">Friend</button></span></li>`);
  }
  mpPlayers.innerHTML = rows.join("");
}
function appendChat(payload) {
  if (!chatLog) return;
  const row = document.createElement("div"); row.className = "row";
  row.innerHTML = `<span class="who" style="color:${payload.color || "#cde"}">${escapeHtml(payload.name || "Guest")}</span>: ${escapeHtml(payload.text)}`;
  chatLog.appendChild(row); chatLog.scrollTop = chatLog.scrollHeight;
  while (chatLog.children.length > 40) chatLog.removeChild(chatLog.firstChild);
}
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * d); canvas.height = Math.round(canvas.clientHeight * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener("resize", resize); resize();
function point(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function moveToward(p) {
  const dx = p.x - world.avatar.x, dy = p.y - world.avatar.y, l = Math.hypot(dx, dy);
  if (l < 4) return;
  const s = Math.min(l, Math.max(2.5, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.006));
  world.avatar.x = Math.max(45, Math.min(canvas.clientWidth - 45, world.avatar.x + dx / l * s));
  world.avatar.y = Math.max(75, Math.min(canvas.clientHeight - 45, world.avatar.y + dy / l * s));
}
function applyJoystick() {
  if (!joyActive || (!joyVec.x && !joyVec.y)) return;
  const speed = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.012;
  world.avatar.x = Math.max(45, Math.min(canvas.clientWidth - 45, world.avatar.x + joyVec.x * speed));
  world.avatar.y = Math.max(75, Math.min(canvas.clientHeight - 45, world.avatar.y + joyVec.y * speed));
}
canvas.addEventListener("pointerdown", e => {
  if (!panel.hidden || (mpPanel && !mpPanel.hidden) || (accountPanel && !accountPanel.hidden)) return;
  pointerId = e.pointerId; canvas.setPointerCapture?.(pointerId); moveToward(point(e)); e.preventDefault();
}, { passive: false });
canvas.addEventListener("pointermove", e => {
  if (e.pointerId !== pointerId) return;
  const n = performance.now(); if (n - lastMoveAt >= 16) moveToward(point(e)); lastMoveAt = n; e.preventDefault();
}, { passive: false });
canvas.addEventListener("pointerup", e => { if (e.pointerId === pointerId) { pointerId = null; saveWorld(world); } });
canvas.addEventListener("pointercancel", () => { pointerId = null; });
if (joystick && knob) {
  function joyFromEvent(e) {
    const r = joystick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
    const len = Math.hypot(dx, dy) || 1; if (len > 1) { dx /= len; dy /= len; }
    joyVec = { x: dx, y: dy }; knob.style.transform = `translate(${dx * 28}px,${dy * 28}px)`;
  }
  joystick.addEventListener("pointerdown", e => { joyActive = true; joystick.setPointerCapture?.(e.pointerId); joyFromEvent(e); e.preventDefault(); }, { passive: false });
  joystick.addEventListener("pointermove", e => { if (!joyActive) return; joyFromEvent(e); e.preventDefault(); }, { passive: false });
  function endJoy() { joyActive = false; joyVec = { x: 0, y: 0 }; knob.style.transform = "translate(0,0)"; }
  joystick.addEventListener("pointerup", endJoy); joystick.addEventListener("pointercancel", endJoy);
}
interactBtn?.addEventListener("click", e => { e.preventDefault(); interact(); });
addEventListener("keydown", e => {
  if (e.target.matches?.("input,textarea")) return;
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "e") interact();
  if (e.key === "Escape") {
    if (!panel.hidden) panel.hidden = true;
    else if (accountPanel && !accountPanel.hidden) accountPanel.hidden = true;
    else if (mpPanel && !mpPanel.hidden) mpPanel.hidden = true;
    else if (scene === "street") returnApartment();
  }
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
function refreshAccountUI() {
  const s = getSession();
  if (accountStatus) accountStatus.textContent = s.mode === "account" ? ("Signed in as " + s.displayName) : "Guest mode";
  if (accountName && document.activeElement !== accountName) accountName.value = s.displayName || "";
  if (!accountList) return;
  const accounts = listAccounts();
  accountList.innerHTML = accounts.length ? accounts.map(a => {
    const active = a.subjectId === s.subjectId ? " · active" : "";
    return `<li><span>${escapeHtml(a.displayName)}${active}</span><span class="acct-actions"><button type="button" data-signin="${a.subjectId}" class="ghost">Use</button><button type="button" data-delete="${a.subjectId}" class="ghost">Delete</button></span></li>`;
  }).join("") : "<li style=\"color:#8a8a8a\">No saved accounts yet</li>";
}
function applySessionToRealtime() {
  const s = getSession();
  realtime.setProfile({ name: s.displayName, avatar: s.avatar || "default" });
  if (mpName) mpName.value = s.displayName;
  if (accountName) accountName.value = s.displayName;
  refreshAccountUI();
}
document.querySelector("#account-btn")?.addEventListener("click", () => {
  if (!accountPanel) return; accountPanel.hidden = !accountPanel.hidden;
  if (!accountPanel.hidden) { panel.hidden = true; if (mpPanel) mpPanel.hidden = true; refreshAccountUI(); }
});
document.querySelector("#account-close")?.addEventListener("click", () => { if (accountPanel) accountPanel.hidden = true; });
document.querySelector("#account-create")?.addEventListener("click", () => {
  const name = (accountName?.value || "Guest").trim().slice(0, 24) || "Guest";
  const s = getSession();
  if (s.mode === "account") updateSessionProfile({ displayName: name });
  else registerAccount(name, s.avatar || "default");
  applySessionToRealtime(); showToast("Account: " + getSession().displayName);
});
document.querySelector("#account-guest")?.addEventListener("click", () => { signOut(); applySessionToRealtime(); showToast("Continuing as Guest"); });
accountList?.addEventListener("click", e => {
  const sid = e.target?.dataset?.signin; const del = e.target?.dataset?.delete;
  if (sid) { signIn(sid); applySessionToRealtime(); showToast("Signed in as " + getSession().displayName); }
  if (del && confirm("Delete this local account?")) { deleteAccount(del); applySessionToRealtime(); showToast("Account deleted"); }
});
document.querySelector("#close-panel")?.addEventListener("click", () => { panel.hidden = true; });
document.querySelector("#save")?.addEventListener("click", () => { setStatus(saveWorld(world) ? "Saved locally" : "Save failed"); });
document.querySelector("#reset")?.addEventListener("click", () => { resetWorld(); location.reload(); });
document.querySelector("#mp-btn")?.addEventListener("click", () => {
  if (!mpPanel) return; mpPanel.hidden = !mpPanel.hidden;
  if (!mpPanel.hidden) { panel.hidden = true; if (accountPanel) accountPanel.hidden = true; updatePresence(); }
});
document.querySelector("#mp-close")?.addEventListener("click", () => { if (mpPanel) mpPanel.hidden = true; });
document.querySelector("#mp-join")?.addEventListener("click", () => {
  const name = (mpName?.value || "Guest").trim().slice(0, 24) || "Guest";
  const room = (mpRoom?.value || "apartment:demo").trim().slice(0, 64) || "apartment:demo";
  updateSessionProfile({ displayName: name });
  try { localStorage.setItem(ROOM_KEY, room); } catch {}
  realtime.setProfile({ name, avatar: getSession().avatar || "default" });
  refreshAccountUI();
  realtime.rejoin(room, { x: world.avatar.x, y: world.avatar.y, scene });
  const url = new URL(location.href); url.searchParams.set("room", room); history.replaceState(null, "", url);
  setStatus("Joining " + room + "…"); updatePresence();
});
document.querySelector("#mp-copy")?.addEventListener("click", async () => {
  const url = new URL(location.href); url.searchParams.set("room", mpRoom?.value || "apartment:demo");
  try { await navigator.clipboard.writeText(url.toString()); setStatus("Invite link copied"); } catch { setStatus(url.toString()); }
});
mpPlayers?.addEventListener("click", e => {
  const id = e.target?.dataset?.invite; if (id) realtime.invite(id);
  const fid = e.target?.dataset?.friend;
  if (fid) {
    const name = e.target?.dataset?.friendName || "Friend";
    addFriend(social, { subjectId: fid, displayName: name, doorOpen: true, roomId: realtime.roomId });
    saveSocial(); realtime.addFriend(fid); showToast("Added " + name + " to friends"); updatePresence();
  }
});
chatForm?.addEventListener("submit", e => {
  e.preventDefault(); const text = chatInput?.value?.trim(); if (!text) return; realtime.chat(text); chatInput.value = "";
});
document.querySelector("#emote-row")?.addEventListener("click", e => {
  const btn = e.target?.closest?.("[data-emote]"); if (!btn) return;
  realtime.emote(btn.dataset.emote); setBubble("self", EMOTES[btn.dataset.emote] || btn.dataset.emote);
});
realtime.on(e => {
  if (e.type === "realtime.status") {
    const s = e.status;
    if (s === "online") setStatus("Online · " + (scene === "street" ? getStreetTier(social).name : world.apartment.currentRoom));
    else if (s === "connecting") setStatus("Connecting…"); else setStatus("Offline · local mode");
  }
  if (["room.snapshot", "user.joined", "user.left", "profile.update"].includes(e.type)) updatePresence();
  if (e.type === "presence.invite") {
    show("🏠 Invitation", (e.payload.name || "Someone") + " invited you to " + e.payload.roomId + ".", [
      ["Accept", () => { realtime.rejoin(e.payload.roomId, { x: 180, y: 350, scene: "apartment" }); if (mpRoom) mpRoom.value = e.payload.roomId; panel.hidden = true; }],
      ["Decline", () => { panel.hidden = true; }]
    ]);
  }
  if (e.type === "chat.message") {
    appendChat(e.payload);
    if (mpPanel?.hidden) showToast((e.payload.name || "Guest") + ": " + e.payload.text);
    if (e.payload.fromId) setBubble(e.payload.fromId, e.payload.text.slice(0, 40));
  }
  if (e.type === "emote.play") {
    const icon = EMOTES[e.payload.emote] || e.payload.emote;
    if (e.payload.fromId) setBubble(e.payload.fromId, icon); else setBubble("self", icon);
  }
  if (e.type === "visit.granted") {
    showToast("Visit granted: " + (e.payload.name || "host"));
    scene = "apartment"; realtime.changeScene("apartment", 200, 300); updateRoomLabel();
  }
  if (e.type === "visit.denied") showToast(e.payload.reason === "closed" ? "Door is closed" : "Visit denied");
  if (e.type === "visit.incoming") show("🚪 Visitor", (e.payload.name || "Someone") + " is visiting (door open).", [["OK", () => { panel.hidden = true; }]]);
  if (e.type === "apartment.door") {
    const u = realtime.users.get(e.payload.id);
    if (u) u.doorOpen = e.payload.open;
    if (social.friends.some(f => f.subjectId === e.payload.id)) {
      updateFriendPresence(social, e.payload.id, { doorOpen: e.payload.open, displayName: e.payload.name });
      saveSocial();
    }
  }
  if (e.type === "cinema.state" || e.type === "cinema.activated") {
    realtime.cinema = e.payload;
    if (e.type === "cinema.activated") showToast("🎬 Screening started!");
  }
  if (e.type === "friend.added") { addFriend(social, e.payload); saveSocial(); }
  if (e.type === "friend.request") showToast((e.payload.name || "Someone") + " added you as a friend");
});
function drawApartment() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = "#26312b"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#35443a"; ctx.fillRect(25, 70, w - 50, h - 95);
  ctx.strokeStyle = "#647268"; ctx.lineWidth = 3; ctx.strokeRect(25, 70, w - 50, h - 95);
  ctx.fillStyle = "#d6dfd7"; ctx.font = "18px system-ui"; ctx.textAlign = "left";
  ctx.fillText((isDoorOpen(world.apartment) ? "🔓 " : "🔒 ") + (world.apartment.rooms.find(r => r.id === world.apartment.currentRoom)?.name || "Apartment"), 45, 105);
  for (const o of objects()) {
    const n = nearest() === o;
    ctx.fillStyle = n ? "#e8d37a" : "#9aa69c"; ctx.beginPath(); ctx.arc(o.x, o.y, n ? o.r + 6 : o.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#172019"; ctx.font = "26px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(objectLabel(o), o.x, o.y); ctx.font = "12px system-ui"; ctx.fillText(o.name, o.x, o.y + o.r + 14);
  }
}
function drawStreet() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const built = buildStreetPlaces(city, social);
  ctx.fillStyle = "#202832"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#39424d"; ctx.fillRect(0, h * 0.28, w, h * 0.45);
  ctx.fillStyle = "#53606d"; ctx.fillRect(0, h * 0.73, w, h * 0.27);
  ctx.fillStyle = "#d9dde2"; ctx.font = "18px system-ui"; ctx.textAlign = "left";
  ctx.fillText("🌆 " + built.tier.name, 30, 42);
  ctx.font = "12px system-ui"; ctx.fillStyle = "#9ab";
  ctx.fillText(friendCount(social) + " friends · credits " + social.credits, 30, 60);
  for (const p of layoutPlaces(built.places, canvas.clientWidth, canvas.clientHeight)) {
    ctx.fillStyle = p.type === "employer" ? "#c7a86a" : p.type === "education" ? "#8eb8d8" : p.type === "cinema" ? "#c9a0e8" : p.type === "friend_door" ? "#7dcea0" : "#9aa69c";
    ctx.fillRect(p.x - 48, p.y - 35, 96, 70);
    ctx.fillStyle = "#10151a"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(p.name, p.x, p.y + 88);
  }
}
function drawUsers() {
  const now = performance.now();
  for (const [id, b] of [...bubbles.entries()]) { if (b.until < now) bubbles.delete(id); }
  for (const u of realtime.users.values()) {
    if ((u.scene || "apartment") !== scene) continue;
    ctx.fillStyle = u.color || "#f1a6cf"; ctx.beginPath(); ctx.arc(u.x, u.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eee"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(u.profile?.name || "Guest", u.x, u.y + 34);
    const bub = bubbles.get(u.id);
    if (bub) { ctx.fillStyle = "rgba(20,24,22,.9)"; ctx.fillRect(u.x - 40, u.y - 48, 80, 22); ctx.fillStyle = "#fff"; ctx.font = "14px system-ui"; ctx.fillText(bub.text, u.x, u.y - 33); }
  }
  ctx.fillStyle = realtime.color || "#b9d7ff"; ctx.beginPath(); ctx.arc(world.avatar.x, world.avatar.y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(world.avatar.x, world.avatar.y - 3, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ddd"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(realtime.profile.name || "You", world.avatar.x, world.avatar.y + 34);
  const selfBub = bubbles.get("self");
  if (selfBub) { ctx.fillStyle = "rgba(20,24,22,.9)"; ctx.fillRect(world.avatar.x - 40, world.avatar.y - 48, 80, 22); ctx.fillStyle = "#fff"; ctx.font = "14px system-ui"; ctx.fillText(selfBub.text, world.avatar.x, world.avatar.y - 33); }
}
function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  if (scene === "street") drawStreet(); else drawApartment(); drawUsers();
}
function tick() {
  applyJoystick();
  let dx = 0, dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy--; if (keys.has("s") || keys.has("arrowdown")) dy++;
  if (keys.has("a") || keys.has("arrowleft")) dx--; if (keys.has("d") || keys.has("arrowright")) dx++;
  if (dx || dy) moveToward({ x: world.avatar.x + dx * 100, y: world.avatar.y + dy * 100 });
  if (performance.now() - lastNetworkMoveAt > 50) { realtime.move(world.avatar.x, world.avatar.y, scene); lastNetworkMoveAt = performance.now(); }
  draw(); requestAnimationFrame(tick);
}
realtime.connect({ x: world.avatar.x, y: world.avatar.y, scene });
updatePresence();
updateRoomLabel();
refreshAccountUI();
tick();
