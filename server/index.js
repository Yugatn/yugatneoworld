import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 8080);
const clients = new Map();
const rooms = new Map();
/** roomId -> cinema pool state */
const cinemas = new Map();
/** roomId -> placed furniture objects */
const furnitureByRoom = new Map();
const COLORS = ["#f1a6cf", "#a6e3f1", "#c7f1a6", "#f1d0a6", "#d0a6f1", "#a6f1d8"];

function roomFor(id) {
  let room = rooms.get(id);
  if (!room) { room = new Map(); rooms.set(id, room); }
  return room;
}
function cinemaFor(roomId) {
  let c = cinemas.get(roomId);
  if (!c) {
    c = { filmId: "premiere-aurora", contributions: {}, active: false, activatedAt: null, viewers: [] };
    cinemas.set(roomId, c);
  }
  return c;
}
function furnitureFor(roomId) {
  let list = furnitureByRoom.get(roomId);
  if (!list) { list = []; furnitureByRoom.set(roomId, list); }
  return list;
}
function sanitizeFurniture(obj) {
  if (!obj || typeof obj !== "object") return null;
  const id = String(obj.id || "").slice(0, 64);
  if (!id) return null;
  return {
    id,
    roomId: String(obj.roomId || "livingRoom").slice(0, 32),
    type: String(obj.type || "furniture").slice(0, 24),
    subtype: String(obj.subtype || "").slice(0, 24),
    name: String(obj.name || "Item").slice(0, 32),
    label: String(obj.label || "◈").slice(0, 8),
    x: Math.max(0, Math.min(4000, Number(obj.x) || 0)),
    y: Math.max(0, Math.min(3000, Number(obj.y) || 0)),
    r: Math.max(16, Math.min(80, Number(obj.r) || 36)),
    capabilities: Array.isArray(obj.capabilities) ? obj.capabilities.slice(0, 8).map(String) : ["furniture.pick"],
    inventoryItemId: String(obj.inventoryItemId || "").slice(0, 32) || null,
    movable: true,
    ownerId: obj.ownerId ? String(obj.ownerId).slice(0, 64) : null
  };
}
function send(socket, type, payload = {}) {
  if (socket.readyState === 1) socket.send(JSON.stringify({ type, payload, ts: Date.now() }));
}
function broadcast(room, message, exceptId = null) {
  for (const [id, peer] of room) {
    if (id !== exceptId && peer.socket.readyState === 1) peer.socket.send(message);
  }
}
function publicPeer(peer) {
  return {
    id: peer.id, roomId: peer.roomId, profile: peer.profile,
    x: peer.x, y: peer.y, scene: peer.scene, color: peer.color,
    doorOpen: peer.doorOpen !== false
  };
}
function sanitizeName(name) {
  const n = String(name || "Guest").replace(/[^\p{L}\p{N}\s._-]/gu, "").trim().slice(0, 24);
  return n || "Guest";
}
function sanitizeRoom(roomId) {
  return String(roomId || "apartment:demo").replace(/[^\w:.-]/g, "").slice(0, 64) || "apartment:demo";
}
function cinemaPublic(c) {
  const total = Object.values(c.contributions).reduce((s, n) => s + (Number(n) || 0), 0);
  return {
    filmId: c.filmId,
    contributions: { ...c.contributions },
    active: c.active,
    activatedAt: c.activatedAt,
    viewers: [...c.viewers],
    total,
    target: c.filmId === "classic-orbit" ? 6 : c.filmId === "doc-city" ? 8 : 10
  };
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = normalize(requestPath === "/" ? "/index.html" : requestPath);
    const file = join(root, safePath);
    if (!file.startsWith(root)) throw new Error("invalid path");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server });
wss.on("connection", (socket) => {
  const id = randomUUID();
  const peer = {
    id, socket, roomId: null,
    profile: { name: "Guest", avatar: "default" },
    x: 180, y: 220, scene: "apartment",
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    doorOpen: true,
    lastMoveAt: 0, lastChatAt: 0, lastEmoteAt: 0
  };
  clients.set(id, peer);
  send(socket, "welcome", { id, color: peer.color });

  socket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString().slice(0, 4000)); } catch { return; }
    const { type, payload = {} } = message;

    if (type === "room.join") {
      const roomId = sanitizeRoom(payload.roomId);
      if (peer.roomId) {
        const prev = roomFor(peer.roomId);
        prev.delete(id);
        broadcast(prev, JSON.stringify({ type: "user.left", payload: { id } }));
        if (!prev.size) { rooms.delete(peer.roomId); cinemas.delete(peer.roomId); furnitureByRoom.delete(peer.roomId); }
      }
      peer.roomId = roomId;
      peer.x = Number.isFinite(Number(payload.x)) ? Number(payload.x) : 180;
      peer.y = Number.isFinite(Number(payload.y)) ? Number(payload.y) : 220;
      peer.scene = payload.scene === "street" ? "street" : "apartment";
      if (payload.doorOpen != null) peer.doorOpen = Boolean(payload.doorOpen);
      if (payload.profile) {
        peer.profile = {
          name: sanitizeName(payload.profile.name),
          avatar: String(payload.profile.avatar || "default").slice(0, 32)
        };
      }
      const room = roomFor(roomId);
      send(socket, "room.snapshot", {
        roomId,
        users: [...room.values()].map(publicPeer),
        self: publicPeer(peer),
        cinema: cinemaPublic(cinemaFor(roomId)),
        furniture: furnitureFor(roomId).map((o) => ({ ...o }))
      });
      room.set(id, peer);
      broadcast(room, JSON.stringify({ type: "user.joined", payload: publicPeer(peer) }), id);
      return;
    }
    if (!peer.roomId) return;
    const room = roomFor(peer.roomId);

    if (type === "avatar.move") {
      const now = Date.now();
      if (now - peer.lastMoveAt < 30) return;
      peer.lastMoveAt = now;
      const x = Number(payload.x), y = Number(payload.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      peer.x = Math.max(20, Math.min(4000, x));
      peer.y = Math.max(40, Math.min(3000, y));
      if (payload.scene === "street" || payload.scene === "apartment") peer.scene = payload.scene;
      broadcast(room, JSON.stringify({ type: "avatar.move", payload: { id, x: peer.x, y: peer.y, scene: peer.scene } }), id);
      return;
    }
    if (type === "profile.update") {
      peer.profile = { name: sanitizeName(payload.name), avatar: String(payload.avatar || peer.profile.avatar || "default").slice(0, 32) };
      broadcast(room, JSON.stringify({ type: "profile.update", payload: { id, profile: peer.profile } }));
      return;
    }
    if (type === "scene.change") {
      peer.scene = payload.scene === "street" ? "street" : "apartment";
      broadcast(room, JSON.stringify({ type: "scene.change", payload: { id, scene: peer.scene, x: peer.x, y: peer.y } }), id);
      return;
    }
    if (type === "apartment.door") {
      peer.doorOpen = Boolean(payload.open);
      broadcast(room, JSON.stringify({ type: "apartment.door", payload: { id, open: peer.doorOpen, name: peer.profile.name } }));
      send(socket, "apartment.door", { id, open: peer.doorOpen, name: peer.profile.name });
      return;
    }
    if (type === "visit.request") {
      const target = room.get(String(payload.targetId));
      if (!target) {
        send(socket, "visit.denied", { reason: "offline", targetId: payload.targetId });
        return;
      }
      if (target.doorOpen === false) {
        send(socket, "visit.denied", { reason: "closed", targetId: target.id, name: target.profile.name });
        return;
      }
      send(target.socket, "visit.incoming", {
        fromId: id, name: peer.profile.name, roomId: peer.roomId
      });
      send(socket, "visit.granted", {
        targetId: target.id, name: target.profile.name, roomId: target.roomId
      });
      return;
    }
    if (type === "friend.add") {
      const target = room.get(String(payload.targetId));
      if (!target) return;
      send(target.socket, "friend.request", { fromId: id, name: peer.profile.name });
      send(socket, "friend.added", {
        subjectId: target.id,
        displayName: target.profile.name,
        doorOpen: target.doorOpen !== false,
        roomId: target.roomId
      });
      return;
    }
    if (type === "cinema.contribute") {
      const c = cinemaFor(peer.roomId);
      if (c.active) {
        send(socket, "cinema.state", cinemaPublic(c));
        return;
      }
      const amount = Math.max(1, Math.min(5, Number(payload.amount) || 2));
      c.contributions[id] = (Number(c.contributions[id]) || 0) + amount;
      if (!c.viewers.includes(id)) c.viewers.push(id);
      if (payload.filmId && !c.active) c.filmId = String(payload.filmId).slice(0, 32);
      const pub = cinemaPublic(c);
      if (pub.total >= pub.target) {
        c.active = true;
        c.activatedAt = Date.now();
      }
      const out = cinemaPublic(c);
      broadcast(room, JSON.stringify({ type: "cinema.state", payload: out }));
      send(socket, "cinema.state", out);
      if (out.active) {
        broadcast(room, JSON.stringify({ type: "cinema.activated", payload: out }));
      }
      return;
    }
    if (type === "cinema.join") {
      const c = cinemaFor(peer.roomId);
      if (c.active && !c.viewers.includes(id)) c.viewers.push(id);
      send(socket, "cinema.state", cinemaPublic(c));
      return;
    }
    if (type === "furniture.place") {
      const obj = sanitizeFurniture({ ...payload, ownerId: id });
      if (!obj) return;
      const list = furnitureFor(peer.roomId);
      if (list.some((o) => o.id === obj.id)) return;
      if (list.length >= 40) return;
      list.push(obj);
      const msg = JSON.stringify({ type: "furniture.placed", payload: obj });
      broadcast(room, msg);
      send(socket, "furniture.placed", obj);
      return;
    }
    if (type === "furniture.remove") {
      const fid = String(payload.id || "").slice(0, 64);
      if (!fid) return;
      const list = furnitureFor(peer.roomId);
      const idx = list.findIndex((o) => o.id === fid);
      if (idx < 0) return;
      list.splice(idx, 1);
      const msg = JSON.stringify({ type: "furniture.removed", payload: { id: fid, by: id } });
      broadcast(room, msg);
      send(socket, "furniture.removed", { id: fid, by: id });
      return;
    }
    if (type === "chat.message") {
      const now = Date.now();
      if (now - peer.lastChatAt < 800) return;
      peer.lastChatAt = now;
      const text = String(payload.text || "").replace(/\s+/g, " ").trim().slice(0, 140);
      if (!text) return;
      const msg = { type: "chat.message", payload: { id: randomUUID(), fromId: id, name: peer.profile.name, color: peer.color, text, ts: now } };
      broadcast(room, JSON.stringify(msg));
      send(socket, msg.type, msg.payload);
      return;
    }
    if (type === "emote.play") {
      const now = Date.now();
      if (now - peer.lastEmoteAt < 600) return;
      peer.lastEmoteAt = now;
      const allowed = new Set(["wave", "heart", "clap", "think", "hello"]);
      const emote = allowed.has(String(payload.emote)) ? String(payload.emote) : null;
      if (!emote) return;
      const msg = {
        type: "emote.play",
        payload: { fromId: id, name: peer.profile.name, color: peer.color, emote, x: peer.x, y: peer.y, scene: peer.scene, ts: now }
      };
      broadcast(room, JSON.stringify(msg));
      send(socket, msg.type, msg.payload);
      return;
    }
    if (type === "presence.invite") {
      const target = room.get(String(payload.targetId));
      if (target) send(target.socket, "presence.invite", { fromId: id, name: peer.profile.name, roomId: peer.roomId });
      return;
    }
    if (type === "interaction.proximity") {
      const target = room.get(String(payload.targetId));
      if (target) send(target.socket, "interaction.proximity", { fromId: id, name: peer.profile.name, objectId: payload.objectId });
    }
  });

  socket.on("close", () => {
    if (peer.roomId) {
      const room = roomFor(peer.roomId);
      room.delete(id);
      broadcast(room, JSON.stringify({ type: "user.left", payload: { id } }));
      if (!room.size) { rooms.delete(peer.roomId); cinemas.delete(peer.roomId); furnitureByRoom.delete(peer.roomId); }
    }
    clients.delete(id);
  });
});

server.listen(port, () => console.log("Yugatn eWorld realtime server listening on :" + port));
