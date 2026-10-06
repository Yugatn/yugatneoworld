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

function roomFor(id) {
  let room = rooms.get(id);
  if (!room) {
    room = new Map();
    rooms.set(id, room);
  }
  return room;
}

function send(socket, type, payload = {}) {
  socket.send(JSON.stringify({ type, payload, ts: Date.now() }));
}

function broadcast(room, message, exceptId = null) {
  for (const [id, peer] of room) {
    if (id !== exceptId && peer.socket.readyState === 1) peer.socket.send(message);
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
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
  const peer = { id, socket, roomId: null, profile: { name: "Guest", avatar: "default" }, x: 180, y: 220 };
  clients.set(id, peer);
  send(socket, "welcome", { id });

  socket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    const { type, payload = {} } = message;

    if (type === "room.join") {
      const roomId = String(payload.roomId || "apartment:demo");
      if (peer.roomId) roomFor(peer.roomId).delete(id);
      peer.roomId = roomId;
      peer.x = Number(payload.x) || 180;
      peer.y = Number(payload.y) || 220;
      peer.profile = payload.profile || peer.profile;
      const room = roomFor(roomId);
      const existing = [...room.values()].map((item) => ({
        id: item.id, roomId: item.roomId, profile: item.profile, x: item.x, y: item.y
      }));
      send(socket, "room.snapshot", { roomId, users: existing });
      room.set(id, peer);
      broadcast(room, JSON.stringify({ type: "user.joined", payload: {
        id, roomId, profile: peer.profile, x: peer.x, y: peer.y
      }}), id);
      return;
    }

    if (!peer.roomId) return;
    const room = roomFor(peer.roomId);

    if (type === "avatar.move") {
      const x = Number(payload.x);
      const y = Number(payload.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      peer.x = Math.max(45, Math.min(2000, x));
      peer.y = Math.max(75, Math.min(1200, y));
      broadcast(room, JSON.stringify({
        type: "avatar.move", payload: { id, x: peer.x, y: peer.y }
      }), id);
    }

    if (type === "presence.invite") {
      const target = room.get(String(payload.targetId));
      if (target) send(target.socket, "presence.invite", { fromId: id, roomId: peer.roomId });
    }

    if (type === "interaction.proximity") {
      const target = room.get(String(payload.targetId));
      if (target) send(target.socket, "interaction.proximity", {
        fromId: id, objectId: payload.objectId
      });
    }
  });

  socket.on("close", () => {
    if (peer.roomId) {
      const room = roomFor(peer.roomId);
      room.delete(id);
      broadcast(room, JSON.stringify({ type: "user.left", payload: { id } }));
      if (!room.size) rooms.delete(peer.roomId);
    }
    clients.delete(id);
  });
});

server.listen(port, () => {
  console.log("Yugatn eWorld realtime server listening on :" + port);
});
