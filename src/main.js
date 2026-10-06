import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { enterRoom } from "./domain/apartment.js";
import { getRoomCapabilities } from "./domain/room-capabilities.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";
import { createEvent } from "./integration/event-envelope.js";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const panel = document.querySelector("#panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");
const actions = document.querySelector("#panel-actions");

const world = loadWorld(createDefaultWorld());
if (!world.apartment) world.apartment = createDefaultWorld().apartment;
const keys = new Set();
const eugene = new EugeneMessengerAdapter();
const symbiont = new SymbiontEventAdapter();
let active = null;

const labels = {
  mailbox: "📮", laptop: "💻", tv: "📺", player: "🎵", wardrobe: "👕",
  door: "🚪", fridge: "🧊", menu: "🍽", phone: "📱", pantry: "🛒",
  books: "📚", mirror: "🪞"
};

function resize() {
  const d = devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * d;
  canvas.height = canvas.clientHeight * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener("resize", resize);
resize();

addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "e") interact();
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function currentObjects() {
  return world.objects.filter((object) => object.roomId === world.apartment.currentRoom);
}

function nearest() {
  let best = null;
  let bestDistance = Infinity;
  for (const object of currentObjects()) {
    const d = distance(world.avatar, object);
    if (d < object.r + 26 && d < bestDistance) {
      best = object;
      bestDistance = d;
    }
  }
  return best;
}

function publish(type, payload = {}, context = {}) {
  const event = createEvent(type, payload, {
    ...context,
    worldId: "local-world",
    apartmentId: "local-apartment"
  });
  symbiont.publish(event);
}

function openRoomCapabilities() {
  const room = getRoomCapabilities(world.apartment.currentRoom);
  if (!room) return;

  title.textContent = "🏠 " + room.title;
  desc.textContent = "This room provides contextual capabilities.";
  actions.innerHTML = "";

  for (const capability of room.capabilities) {
    const button = document.createElement("button");
    button.textContent = capability.label;
    button.onclick = () => runRoomCapability(capability.id);
    actions.appendChild(button);
  }

  const back = document.createElement("button");
  back.textContent = "Close";
  back.onclick = () => { panel.hidden = true; };
  actions.appendChild(back);
  panel.hidden = false;
}

function interact() {
  const object = nearest();
  if (!object) {
    if (world.apartment.currentRoom !== "livingRoom") openRoomCapabilities();
    return;
  }
  active = object;
  openPanel(object);
  publish("object.interacted", {}, { objectId: object.id });
}

function openPanel(object) {
  title.textContent = (labels[object.type] || "◈") + " " + object.name;
  desc.textContent = "This object is the spatial interface for its capability.";
  actions.innerHTML = "";

  for (const capability of object.capabilities) {
    const button = document.createElement("button");
    button.textContent = capability;
    button.onclick = () => runCapability(object, capability);
    actions.appendChild(button);
  }

  panel.hidden = false;
}

async function runRoomCapability(capability) {
  if (capability === "food.delivery") {
    desc.textContent = "Food & Delivery: choose a cafe, restaurant or grocery store. Ordering requires explicit confirmation and a verified commerce connector.";
  } else if (capability === "cafe.search") {
    desc.textContent = "Cafes: connector placeholder. No real availability or prices are claimed.";
  } else if (capability === "restaurant.search") {
    desc.textContent = "Restaurants: connector placeholder. No real availability or prices are claimed.";
  } else if (capability === "grocery.search") {
    desc.textContent = "Grocery stores: connector placeholder. No external order is placed.";
  } else if (capability === "messenger") {
    desc.textContent = "Eugene Messenger capability is exposed through its adapter.";
  } else if (capability === "social") {
    desc.textContent = "eWorld social capability.";
  } else if (capability === "video") {
    desc.textContent = "Video capability.";
  } else if (capability === "music") {
    desc.textContent = "Music capability.";
  } else if (capability === "avatar.edit") {
    world.avatar.appearance.clothes = world.avatar.appearance.clothes === "casual" ? "formal" : "casual";
    desc.textContent = "Avatar outfit changed to " + world.avatar.appearance.clothes + ".";
    saveWorld(world);
  } else if (capability === "furniture.edit") {
    desc.textContent = "Apartment editor is the next furniture implementation stage.";
  } else if (capability === "inventory") {
    desc.textContent = "Inventory capability.";
  }

  publish(capability + ".requested", {}, { capability });
}

async function runCapability(object, capability) {
  if (capability === "room.enter") {
    enterRoom(world.apartment, object.targetRoom);
    world.avatar.x = 180;
    world.avatar.y = 350;
    panel.hidden = true;
    active = null;
    saveWorld(world);
    publish("room.entered", { roomId: object.targetRoom }, { objectId: object.id, capability });
    return;
  }

  if (capability === "message.read" || capability === "message.compose") {
    await eugene.listConversations();
    desc.textContent = "Eugene Messenger adapter is ready; verified external transport is not connected yet.";
  } else if (capability === "messenger" || capability === "social") {
    desc.textContent = "Social workspace adapter placeholder. Eugene integration stays behind its verified API contract.";
  } else if (capability === "video") {
    desc.textContent = "Video player capability placeholder.";
  } else if (capability === "music") {
    desc.textContent = "Music player capability placeholder.";
  } else if (capability === "avatar.edit") {
    world.avatar.appearance.clothes = world.avatar.appearance.clothes === "casual" ? "formal" : "casual";
    desc.textContent = "Avatar outfit changed to " + world.avatar.appearance.clothes + ".";
    saveWorld(world);
  }

  publish(capability + ".requested", {}, { objectId: object.id, capability });
}

document.querySelector("#close-panel").onclick = () => {
  panel.hidden = true;
  active = null;
};
document.querySelector("#save").onclick = () => saveWorld(world);
document.querySelector("#reset").onclick = () => {
  resetWorld();
  location.reload();
};

function tick() {
  const speed = 3.2;
  let dx = 0;
  let dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy--;
  if (keys.has("s") || keys.has("arrowdown")) dy++;
  if (keys.has("a") || keys.has("arrowleft")) dx--;
  if (keys.has("d") || keys.has("arrowright")) dx++;

  if (dx || dy) {
    const length = Math.hypot(dx, dy) || 1;
    world.avatar.x = Math.max(45, Math.min(canvas.clientWidth - 45, world.avatar.x + dx / length * speed));
    world.avatar.y = Math.max(75, Math.min(canvas.clientHeight - 45, world.avatar.y + dy / length * speed));
  }

  draw();
  requestAnimationFrame(tick);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#26312b";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#35443a";
  ctx.fillRect(25, 70, width - 50, height - 95);
  ctx.strokeStyle = "#647268";
  ctx.lineWidth = 3;
  ctx.strokeRect(25, 70, width - 50, height - 95);

  const room = world.apartment.currentRoom;
  ctx.fillStyle = "#d6dfd7";
  ctx.font = "18px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(world.apartment.rooms.find((r) => r.id === room)?.name || room, 45, 105);

  ctx.strokeStyle = "#56645b";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 130, width - 120, height - 180);

  for (const object of currentObjects()) {
    const near = nearest() === object;
    ctx.fillStyle = near ? "#e8d37a" : "#9aa69c";
    ctx.beginPath();
    ctx.arc(object.x, object.y, near ? object.r + 6 : object.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#172019";
    ctx.font = "26px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[object.type] || "◈", object.x, object.y);
    ctx.font = "12px system-ui";
    ctx.fillText(object.name, object.x, object.y + object.r + 14);
  }

  ctx.fillStyle = "#b9d7ff";
  ctx.beginPath();
  ctx.arc(world.avatar.x, world.avatar.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(world.avatar.x, world.avatar.y - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ddd";
  ctx.font = "12px system-ui";
  ctx.fillText("You", world.avatar.x - 14, world.avatar.y + 34);

  const object = nearest();
  document.querySelector("#status").textContent = object ? "Near: " + object.name : world.apartment.rooms.find((r) => r.id === room)?.name || room;
}

tick();
