import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { enterRoom } from "./domain/apartment.js";
import { getRoomCapabilities } from "./domain/room-capabilities.js";
import { createCityState } from "./domain/city.js";
import { layoutObjects, layoutPlaces, DESIGN } from "./domain/layout.js";
import { createInventory, placeFurniture, pickFurniture, listPlaceable, FURNITURE_CATALOG } from "./domain/inventory.js";
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
const PROFILE_KEY = "yugatn-eworld-profile-v1";
const ROOM_KEY = "yugatn-eworld-room-v1";
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { return {}; } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} }
const savedProfile = loadProfile();
const params = new URLSearchParams(location.search);
const initialRoom = params.get("room") || localStorage.getItem(ROOM_KEY) || "apartment:demo";
const initialName = savedProfile.name || "Guest";
const world = loadWorld(createDefaultWorld());
if (!world.apartment) world.apartment = createDefaultWorld().apartment;
if (!Array.isArray(world.inventory)) world.inventory = createInventory();
const city = createCityState();
const keys = new Set();
const eugene = new EugeneMessengerAdapter();
const symbiont = new SymbiontEventAdapter();
const realtime = new RealtimeWorld({ roomId: initialRoom, profile: { name: initialName, avatar: savedProfile.avatar || "default" } });
let pointerId = null, lastMoveAt = 0, lastNetworkMoveAt = 0, scene = "apartment";
let joyVec = { x: 0, y: 0 }, joyActive = false;
const labels = { mailbox:"📮",laptop:"💻",tv:"📺",player:"🎵",wardrobe:"👕",door:"🚪",fridge:"🧊",menu:"🍽",phone:"📱",pantry:"🛒",books:"📚",mirror:"🪞",portal:"🌆",furniture:"🪑",decoration:"🪴",chair:"🪑",plant:"🪴",table:"🪵",lamp:"💡" };
const EMOTES = { wave:"👋", heart:"❤️", clap:"👏", think:"💭", hello:"💬" };
const bubbles = new Map();
const roomLabelEl = document.querySelector("#room-label");
const toastEl = document.querySelector("#toast");
if (mpName) mpName.value = initialName;
if (mpRoom) mpRoom.value = initialRoom;
function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function updateRoomLabel() {
  if (!roomLabelEl) return;
  if (scene === "street") roomLabelEl.textContent = "City Street";
  else roomLabelEl.textContent = world.apartment.rooms.find(r => r.id === world.apartment.currentRoom)?.name || "Apartment";
}
function showToast(text, ms = 2800) {
  if (!toastEl) return;
  toastEl.textContent = text; toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.hidden = true; }, ms);
}
function setBubble(id, text, ms = 2500) { bubbles.set(id, { text, until: performance.now() + ms }); }
function objectLabel(o) { return o.label || labels[o.subtype] || labels[o.type] || "\u25C8"; }
function designFromScreen(sx, sy) {
  const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
  return { x: (sx / w) * DESIGN.width, y: (sy / h) * DESIGN.height };
}
function openInventory() {
  const items = listPlaceable(world.inventory);
  if (!items.length) {
    show("\uD83D\uDCE6 Inventory", "No placeable items. Pick up furniture in the room to return it here.", [["Close", () => { panel.hidden = true; }]]);
    return;
  }
  const buttons = items.map(item => {
    const cat = FURNITURE_CATALOG[item.id];
    return [((cat && cat.label) || "\u25C8") + " Place " + item.name, () => {
      const pos = designFromScreen(world.avatar.x + 50, world.avatar.y);
      const obj = placeFurniture(world, world.inventory, item.id, world.apartment.currentRoom, pos.x, pos.y);
      if (obj) {
        saveWorld(world); showToast("Placed " + obj.name);
        publish("furniture.placed", { itemId: item.id, objectId: obj.id });
        panel.hidden = true;
      } else show("\uD83D\uDCE6 Inventory", "Could not place " + item.name);
    }];
  });
  buttons.push(["Close", () => { panel.hidden = true; }]);
  show("\uD83D\uDCE6 Inventory \u00B7 place near you", "Items are placed next to your avatar in the current room.", buttons);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function updatePresence() {
  if (presenceEl) { const n = 1 + realtime.users.size; presenceEl.textContent = String(n); presenceEl.title = n + " in room"; }
  if (!mpPlayers) return;
  const rows = [`<li><span class="dot" style="background:${realtime.color || "#b9d7ff"}"></span>You \u00B7 ${escapeHtml(realtime.profile.name)}</li>`];
  for (const u of realtime.users.values()) {
    rows.push(`<li><span class="dot" style="background:${u.color || "#f1a6cf"}"></span>${escapeHtml(u.profile?.name || "Guest")}<button type="button" data-invite="${u.id}" class="ghost" style="margin-left:auto;min-height:32px;padding:4px 8px">Invite</button></li>`);
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
  if (!panel.hidden || (mpPanel && !mpPanel.hidden)) return;
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
    else if (mpPanel && !mpPanel.hidden) mpPanel.hidden = true;
    else if (scene === "street") returnApartment();
  }
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
function objects() { return layoutObjects(world.objects, world.apartment.currentRoom, canvas.clientWidth, canvas.clientHeight); }
function nearest() {
  let b = null, bd = Infinity;
  for (const o of objects()) { const d = distance(world.avatar, o); if (d < o.r + 28 && d < bd) { b = o; bd = d; } }
  return b;
}
function publish(type, payload = {}, context = {}) {
  symbiont.publish(createEvent(type, payload, { ...context, worldId: "local-world", apartmentId: "local-apartment" }));
}
function show(t, d, buttons = []) {
  title.textContent = t; desc.textContent = d; actions.innerHTML = "";
  for (const [label, fn] of buttons) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = fn; actions.appendChild(b);
  }
  panel.hidden = false; if (mpPanel) mpPanel.hidden = true;
}
function openWork() {
  show("\uD83D\uDCBC STNetwork", "One employment identity, two interfaces.", [
    ["Classic work interface", () => { location.href = "src/classic/work.html"; }],
    ["Employer directory", () => { location.href = "src/classic/employer.html"; }],
    ["Resume", () => { location.href = "src/classic/work.html"; }]
  ]);
  publish("employment.interface.opened");
}
function openCity() { scene = "street"; panel.hidden = true; realtime.changeScene("street", world.avatar.x, world.avatar.y); updateRoomLabel(); publish("street.entered"); }
function returnApartment() { scene = "apartment"; panel.hidden = true; realtime.changeScene("apartment", world.avatar.x, world.avatar.y); updateRoomLabel(); publish("apartment.entered"); }
function openPlace(p) {
  const buttons = [];
  if (p.type === "employer") {
    buttons.push(
      ["Enter company", () => { publish("company.entered", { placeId: p.id }); location.href = "src/classic/company.html?id=" + encodeURIComponent(p.id); }],
      ["View vacancies", () => { location.href = "src/classic/work.html"; }],
      ["Contact via Eugene", () => { publish("employer.contact.requested", { placeId: p.id }); show("Eugene", "Employer conversation requested."); }]
    );
  } else if (p.type === "education") buttons.push(["Open learning", () => show(p.name, p.description)]);
  else buttons.push(["Open service", () => show(p.name, p.description)]);
  buttons.push(["Back to street", () => { panel.hidden = true; }]);
  show("\uD83C\uDFE2 " + p.name, p.description, buttons);
  publish("city.place.opened", { placeId: p.id, placeType: p.type });
}
function interact() {
  if (scene === "street") {
    const places = layoutPlaces(city.places, canvas.clientWidth, canvas.clientHeight);
    const p = places.find(pl => Math.hypot(pl.x - world.avatar.x, pl.y - world.avatar.y) < 90);
    if (p) return openPlace(p); return;
  }
  const o = nearest();
  if (!o) { openRoomCapabilities(); return; }
  if (o.type === "portal") { openCity(); return; }
  const buttons = (o.capabilities || []).map(c => [c, () => runCapability(o, c)]);
  buttons.push(["\uD83D\uDCBC STNetwork", openWork]);
  for (const u of realtime.users.values()) {
    if ((u.scene || "apartment") !== scene) continue;
    buttons.push(["Invite " + (u.profile?.name || "user"), () => realtime.invite(u.id)]);
  }
  show(objectLabel(o) + " " + o.name, "A spatial capability.", buttons);
  publish("object.interacted", {}, { objectId: o.id });
}
async function runCapability(o, c) {
  if (c === "room.enter") {
    enterRoom(world.apartment, o.targetRoom);
    world.avatar.x = Math.min(canvas.clientWidth - 45, 180);
    world.avatar.y = Math.min(canvas.clientHeight - 45, 350);
    panel.hidden = true; saveWorld(world); updateRoomLabel();
    publish("room.entered", { roomId: o.targetRoom }, { objectId: o.id, capability: c }); return;
  }
  if (c === "employment" || c === "jobs" || c === "resume") return openWork();
  if (c === "message.read" || c === "message.compose") {
    await eugene.listConversations?.();
    show("Eugene Messenger", "Eugene adapter boundary is ready; external transport is not configured."); return;
  }
  if (c === "avatar.edit") {
    world.avatar.appearance.clothes = world.avatar.appearance.clothes === "casual" ? "formal" : "casual";
    saveWorld(world); show("\uD83D\uDC55 Avatar", "Outfit changed to " + world.avatar.appearance.clothes); return;
  }
  if (c === "furniture.pick") {
    const picked = pickFurniture(world, world.inventory, o.id);
    if (picked) {
      saveWorld(world); showToast("Picked up " + picked.name);
      publish("furniture.picked", { objectId: o.id, itemId: picked.inventoryItemId });
      panel.hidden = true;
    } else show("Furniture", "Cannot pick up this object.");
    return;
  }
  show(objectLabel(o) + " " + o.name, "Capability " + c + " is available at the integration boundary.");
  publish(c + ".requested", {}, { objectId: o.id, capability: c });
}
function openRoomCapabilities() {
  const r = getRoomCapabilities(world.apartment.currentRoom); if (!r) return;
  const buttons = r.capabilities.map(c => [c.label, () => {
    if (["employment", "work", "jobs", "resume"].includes(c.id)) openWork();
    else if (c.id === "furniture.edit" || c.id === "inventory") openInventory();
    else show("Capability", c.label);
  }]);
  buttons.push(["\uD83D\uDCE6 Inventory / furniture", openInventory]);
  buttons.push(["\uD83D\uDCBC STNetwork", openWork]);
  show("\uD83C\uDFE0 " + r.title, "Contextual capabilities for this room.", buttons);
}
document.querySelector("#close-panel")?.addEventListener("click", () => { panel.hidden = true; });
document.querySelector("#save")?.addEventListener("click", () => { setStatus(saveWorld(world) ? "Saved locally" : "Save failed"); });
document.querySelector("#reset")?.addEventListener("click", () => { resetWorld(); location.reload(); });
document.querySelector("#mp-btn")?.addEventListener("click", () => {
  if (!mpPanel) return; mpPanel.hidden = !mpPanel.hidden;
  if (!mpPanel.hidden) { panel.hidden = true; updatePresence(); }
});
document.querySelector("#mp-close")?.addEventListener("click", () => { if (mpPanel) mpPanel.hidden = true; });
document.querySelector("#mp-join")?.addEventListener("click", () => {
  const name = (mpName?.value || "Guest").trim().slice(0, 24) || "Guest";
  const room = (mpRoom?.value || "apartment:demo").trim().slice(0, 64) || "apartment:demo";
  saveProfile({ name, avatar: "default" }); try { localStorage.setItem(ROOM_KEY, room); } catch {}
  realtime.setProfile({ name, avatar: "default" });
  realtime.rejoin(room, { x: world.avatar.x, y: world.avatar.y, scene });
  const url = new URL(location.href); url.searchParams.set("room", room); history.replaceState(null, "", url);
  setStatus("Joining " + room + "\u2026"); updatePresence();
});
document.querySelector("#mp-copy")?.addEventListener("click", async () => {
  const url = new URL(location.href); url.searchParams.set("room", mpRoom?.value || "apartment:demo");
  try { await navigator.clipboard.writeText(url.toString()); setStatus("Invite link copied"); } catch { setStatus(url.toString()); }
});
mpPlayers?.addEventListener("click", e => { const id = e.target?.dataset?.invite; if (id) realtime.invite(id); });
chatForm?.addEventListener("submit", e => {
  e.preventDefault(); const text = chatInput?.value?.trim(); if (!text) return; realtime.chat(text); chatInput.value = "";
});
document.querySelector("#emote-row")?.addEventListener("click", e => {
  const btn = e.target?.closest?.("[data-emote]");
  if (!btn) return;
  const emote = btn.dataset.emote;
  realtime.emote(emote);
  setBubble("self", EMOTES[emote] || emote);
});
realtime.on(e => {
  if (e.type === "realtime.status") {
    const s = e.status;
    if (s === "online") setStatus("Online \u00B7 " + (scene === "street" ? "Street" : world.apartment.currentRoom));
    else if (s === "connecting") setStatus("Connecting\u2026"); else setStatus("Offline \u00B7 local mode");
  }
  if (["room.snapshot", "user.joined", "user.left", "profile.update"].includes(e.type)) updatePresence();
  if (e.type === "presence.invite") {
    show("\uD83C\uDFE0 Invitation", (e.payload.name || "Someone") + " invited you to " + e.payload.roomId + ".", [
      ["Accept", () => { realtime.rejoin(e.payload.roomId, { x: 180, y: 350, scene: "apartment" }); if (mpRoom) mpRoom.value = e.payload.roomId; panel.hidden = true; }],
      ["Decline", () => { panel.hidden = true; }]
    ]);
  }
  if (e.type === "interaction.proximity") show("Nearby interaction", (e.payload.name || "Someone") + " interacted nearby.");
  if (e.type === "chat.message") {
    appendChat(e.payload);
    if (mpPanel?.hidden) showToast((e.payload.name || "Guest") + ": " + e.payload.text);
    const uid = e.payload.fromId;
    if (uid) setBubble(uid, (e.payload.text || "").slice(0, 40));
  }
  if (e.type === "emote.play") {
    const emoji = EMOTES[e.payload.emote] || e.payload.emote;
    const uid = e.payload.fromId;
    if (uid === realtime.id || !uid) setBubble("self", emoji);
    else if (uid) setBubble(uid, emoji);
    if (mpPanel?.hidden) showToast((e.payload.name || "Guest") + " " + emoji);
  }
});
function drawApartment() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = "#26312b"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#35443a"; ctx.fillRect(25, 70, w - 50, h - 95);
  ctx.strokeStyle = "#647268"; ctx.lineWidth = 3; ctx.strokeRect(25, 70, w - 50, h - 95);
  ctx.fillStyle = "#d6dfd7"; ctx.font = "18px system-ui"; ctx.textAlign = "left";
  ctx.fillText(world.apartment.rooms.find(r => r.id === world.apartment.currentRoom)?.name || "Apartment", 45, 105);
  for (const o of objects()) {
    const n = nearest() === o;
    ctx.fillStyle = n ? "#e8d37a" : "#9aa69c"; ctx.beginPath(); ctx.arc(o.x, o.y, n ? o.r + 6 : o.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#172019"; ctx.font = "26px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(objectLabel(o), o.x, o.y); ctx.font = "12px system-ui"; ctx.fillText(o.name, o.x, o.y + o.r + 14);
  }
}
function drawStreet() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = "#202832"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#39424d"; ctx.fillRect(0, h * 0.28, w, h * 0.45);
  ctx.fillStyle = "#53606d"; ctx.fillRect(0, h * 0.73, w, h * 0.27);
  ctx.fillStyle = "#d9dde2"; ctx.font = "18px system-ui"; ctx.textAlign = "left"; ctx.fillText("\uD83C\uDF06 City Street", 30, 42);
  for (const p of layoutPlaces(city.places, canvas.clientWidth, canvas.clientHeight)) {
    ctx.fillStyle = p.type === "employer" ? "#c7a86a" : p.type === "education" ? "#8eb8d8" : "#9aa69c";
    ctx.fillRect(p.x - 48, p.y - 35, 96, 70);
    ctx.fillStyle = "#10151a"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(p.name, p.x, p.y + 88);
  }
}
function drawBubble(x, y, text) {
  if (!text) return;
  ctx.font = "16px system-ui";
  const tw = Math.min(160, ctx.measureText(text).width + 16);
  const bx = x - tw / 2, by = y - 48;
  ctx.fillStyle = "rgba(20,24,22,0.9)";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, tw, 28, 8); else ctx.rect(bx, by, tw, 28);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f5f7f5"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + 14);
}
function drawUsers() {
  const now = performance.now();
  for (const [id, b] of [...bubbles.entries()]) { if (b.until < now) bubbles.delete(id); }
  for (const u of realtime.users.values()) {
    if ((u.scene || "apartment") !== scene) continue;
    ctx.fillStyle = u.color || "#f1a6cf"; ctx.beginPath(); ctx.arc(u.x, u.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eee"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(u.profile?.name || "Guest", u.x, u.y + 34);
    const bub = bubbles.get(u.id);
    if (bub) drawBubble(u.x, u.y, bub.text);
  }
  ctx.fillStyle = realtime.color || "#b9d7ff"; ctx.beginPath(); ctx.arc(world.avatar.x, world.avatar.y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(world.avatar.x, world.avatar.y - 3, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ddd"; ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText(realtime.profile.name || "You", world.avatar.x, world.avatar.y + 34);
  const selfBub = bubbles.get("self");
  if (selfBub) drawBubble(world.avatar.x, world.avatar.y, selfBub.text);
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
tick();
