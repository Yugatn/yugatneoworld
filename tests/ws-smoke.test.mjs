import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import WebSocket from "ws";

const port = 18670;
const child = spawn(process.execPath, ["server/index.js"], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

function track(ws) {
  const arr = [];
  ws.on("message", (raw) => {
    try { arr.push(JSON.parse(raw.toString())); } catch {}
  });
  return arr;
}
async function waitMsg(arr, pred, ms = 5000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const hit = arr.find(pred);
    if (hit) return hit;
    await sleep(40);
  }
  throw new Error("timeout; types=" + arr.map((m) => m.type).join(","));
}

try {
  await sleep(700);

  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200, "home page should be served");
  assert.match(home.headers.get("content-security-policy") || "", /default-src 'self'/);
  for (const privatePath of ["/package.json", "/server/index.js", "/docs/ROADMAP.md", "/tests/ws-smoke.test.mjs"]) {
    const response = await fetch(`http://127.0.0.1:${port}${privatePath}`);
    assert.equal(response.status, 404, `${privatePath} must not be served publicly`);
  }
  const methodCheck = await fetch(`http://127.0.0.1:${port}/`, { method: "POST" });
  assert.equal(methodCheck.status, 405, "unsupported HTTP methods should be rejected");

  const a = new WebSocket(`ws://127.0.0.1:${port}`);
  const b = new WebSocket(`ws://127.0.0.1:${port}`);
  const aMsgs = track(a);
  const bMsgs = track(b);
  await Promise.all([
    new Promise((r, j) => { a.once("open", r); a.once("error", j); }),
    new Promise((r, j) => { b.once("open", r); b.once("error", j); })
  ]);

  const bounds = new WebSocket(`ws://127.0.0.1:${port}`);
  const boundsMsgs = track(bounds);
  await new Promise((r, j) => { bounds.once("open", r); bounds.once("error", j); });
  bounds.send(JSON.stringify({
    type: "room.join",
    payload: { roomId: "test:bounds", x: 999999, y: -100, profile: { name: "Bounds" } }
  }));
  const boundsSnapshot = await waitMsg(boundsMsgs, (m) => m.type === "room.snapshot");
  assert.equal(boundsSnapshot.payload.self.x, 4000, "join X must be clamped");
  assert.equal(boundsSnapshot.payload.self.y, 40, "join Y must be clamped");
  bounds.close();

  const flood = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise((r, j) => { flood.once("open", r); flood.once("error", j); });
  const floodClosed = new Promise((resolveClose) => flood.once("close", (code) => resolveClose(code)));
  for (let i = 0; i < 220; i++) {
    if (flood.readyState !== WebSocket.OPEN) break;
    flood.send(JSON.stringify({ type: "unknown.smoke", payload: { n: i } }));
  }
  assert.equal(await floodClosed, 1008, "a connection that exceeds the message burst must be closed");
  flood.terminate();

  a.send(JSON.stringify({
    type: "room.join",
    payload: { roomId: "test:smoke", x: 100, y: 100, profile: { name: "Alice" } }
  }));
  await waitMsg(aMsgs, (m) => m.type === "room.snapshot");

  b.send(JSON.stringify({
    type: "room.join",
    payload: { roomId: "test:smoke", x: 200, y: 200, profile: { name: "Bob" } }
  }));
  await waitMsg(bMsgs, (m) => m.type === "room.snapshot");
  await sleep(100);

  a.send(JSON.stringify({ type: "chat.message", payload: { text: "hello-smoke" } }));
  const chat = await waitMsg(bMsgs, (m) => m.type === "chat.message" && m.payload?.text === "hello-smoke");
  assert.equal(chat.payload.text, "hello-smoke");

  a.send(JSON.stringify({ type: "emote.play", payload: { emote: "wave" } }));
  const emote = await waitMsg(bMsgs, (m) => m.type === "emote.play" && m.payload?.emote === "wave");
  assert.equal(emote.payload.emote, "wave");

  a.send(JSON.stringify({ type: "apartment.door", payload: { open: false } }));
  const door = await waitMsg(bMsgs, (m) => m.type === "apartment.door" && m.payload?.open === false);
  assert.equal(door.payload.open, false);

  a.send(JSON.stringify({ type: "cinema.contribute", payload: { amount: 5, filmId: "premiere-aurora" } }));
  const cin = await waitMsg(bMsgs, (m) => m.type === "cinema.state");
  assert.ok(cin.payload.total >= 5);

  a.send(JSON.stringify({
    type: "furniture.place",
    payload: {
      id: "chair-basic-smoke1", roomId: "livingRoom", type: "furniture", subtype: "chair",
      name: "Chair", label: "💺", x: 220, y: 240, r: 36, capabilities: ["furniture.pick"],
      inventoryItemId: "chair-basic", movable: true
    }
  }));
  const placed = await waitMsg(bMsgs, (m) => m.type === "furniture.placed" && m.payload?.id === "chair-basic-smoke1");
  assert.equal(placed.payload.name, "Chair");

  b.send(JSON.stringify({ type: "furniture.remove", payload: { id: "chair-basic-smoke1" } }));
  const denied = await waitMsg(bMsgs, (m) => m.type === "furniture.error" && m.payload?.id === "chair-basic-smoke1");
  assert.equal(denied.payload.reason, "not_owner");
  await sleep(100);
  assert.equal(aMsgs.some((m) => m.type === "furniture.removed" && m.payload?.id === "chair-basic-smoke1"), false,
    "a non-owner must not remove another user's furniture");

  a.send(JSON.stringify({ type: "furniture.remove", payload: { id: "chair-basic-smoke1" } }));
  const removed = await waitMsg(bMsgs, (m) => m.type === "furniture.removed" && m.payload?.id === "chair-basic-smoke1");
  assert.equal(removed.payload.id, "chair-basic-smoke1");

  const bSnap = bMsgs.find((m) => m.type === "room.snapshot");
  assert.ok(bSnap.payload.users.some((u) => u.profile?.name === "Alice"), "B snapshot should list Alice");
  assert.ok(Array.isArray(bSnap.payload.furniture), "snapshot should include furniture array");

  const bWelcome = bMsgs.find((m) => m.type === "welcome");
  const aWelcome = aMsgs.find((m) => m.type === "welcome");
  const bId = bWelcome?.payload?.id;
  const aId = aWelcome?.payload?.id;
  assert.ok(bId && aId);
  a.send(JSON.stringify({ type: "key.grant", payload: { targetId: bId, durationHours: 1, permissions: ["visit", "media", "games"] } }));
  const keyG = await waitMsg(bMsgs, (m) => m.type === "key.granted" && m.payload?.role === "guest");
  assert.ok(keyG.payload.key?.permissions?.includes("media"));
  assert.ok(keyG.payload.key?.expiresAt > Date.now());

  b.send(JSON.stringify({ type: "visit.request", payload: { targetId: aId } }));
  const viaKey = await waitMsg(bMsgs, (m) => m.type === "visit.granted");
  assert.equal(viaKey.payload.viaKey, true);

  a.close();
  b.close();
  console.log("ws-smoke OK");
} finally {
  child.kill("SIGTERM");
  await sleep(100);
}
