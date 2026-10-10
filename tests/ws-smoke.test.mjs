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
  const a = new WebSocket(`ws://127.0.0.1:${port}`);
  const b = new WebSocket(`ws://127.0.0.1:${port}`);
  const aMsgs = track(a);
  const bMsgs = track(b);
  await Promise.all([
    new Promise((r, j) => { a.once("open", r); a.once("error", j); }),
    new Promise((r, j) => { b.once("open", r); b.once("error", j); })
  ]);

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

  const bSnap = bMsgs.find((m) => m.type === "room.snapshot");
  assert.ok(bSnap.payload.users.some((u) => u.profile?.name === "Alice"), "B snapshot should list Alice");

  a.close();
  b.close();
  console.log("ws-smoke OK");
} finally {
  child.kill("SIGTERM");
  await sleep(100);
}
