import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const panel = document.querySelector("#panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");
const actions = document.querySelector("#panel-actions");

const world = loadWorld(createDefaultWorld());
const keys = new Set();
const eugene = new EugeneMessengerAdapter();
const symbiont = new SymbiontEventAdapter();
let active = null;

const labels = {
  mailbox: "📮",
  laptop: "💻",
  tv: "📺",
  player: "🎵",
  wardrobe: "👕",
  door: "🚪"
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

function nearest() {
  let best = null;
  let bestDistance = Infinity;
  for (const object of world.objects) {
    const d = distance(world.avatar, object);
    if (d < object.r + 26 && d < bestDistance) {
      best = object;
      bestDistance = d;
    }
  }
  return best;
}

function interact() {
  const object = nearest();
  if (!object) return;
  active = object;
  openPanel(object);
  symbiont.publish({
    event_id: crypto.randomUUID(),
    event_type: "object.interacted",
    object_id: object.id,
    timestamp: new Date().toISOString()
  });
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

async function runCapability(object, capability) {
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
    world.avatar.appearance.clothes =
      world.avatar.appearance.clothes === "casual" ? "formal" : "casual";
    desc.textContent = "Avatar outfit changed to " + world.avatar.appearance.clothes + ".";
    saveWorld(world);
  } else if (capability === "room.enter") {
    desc.textContent = "Room transition capability placeholder.";
  }

  symbiont.publish({
    event_id: crypto.randomUUID(),
    event_type: capability + ".requested",
    object_id: object.id,
    timestamp: new Date().toISOString()
  });
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

  ctx.strokeStyle = "#56645b";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 90, width - 120, 180);
  ctx.strokeRect(60, 300, width - 120, height - 350);

  for (const object of world.objects) {
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
  document.querySelector("#status").textContent =
    object ? "Near: " + object.name : "Apartment";
}

tick();
