export class RealtimeWorld {
  constructor({ url = null, roomId = "apartment:demo", profile = {} } = {}) {
    this.url = url || (location.protocol === "https:" ? "wss://" + location.host : "ws://" + location.host);
    this.roomId = roomId;
    this.profile = profile;
    this.socket = null;
    this.id = null;
    this.users = new Map();
    this.listeners = new Set();
  }

  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) listener(event);
  }

  connect(position = { x: 180, y: 220 }) {
    if (this.socket && this.socket.readyState <= 1) return;
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("open", () => {
      this.send("room.join", {
        roomId: this.roomId,
        x: position.x,
        y: position.y,
        profile: this.profile
      });
      this.emit({ type: "realtime.status", status: "online" });
    });
    this.socket.addEventListener("message", (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      this.handle(message);
    });
    this.socket.addEventListener("close", () => this.emit({ type: "realtime.status", status: "offline" }));
    this.socket.addEventListener("error", () => this.emit({ type: "realtime.status", status: "error" }));
  }

  send(type, payload = {}) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  move(x, y) { this.send("avatar.move", { x, y }); }
  invite(targetId) { this.send("presence.invite", { targetId }); }
  proximity(targetId, objectId) { this.send("interaction.proximity", { targetId, objectId }); }

  handle(message) {
    const { type, payload = {} } = message;
    if (type === "welcome") this.id = payload.id;
    if (type === "room.snapshot") {
      this.users.clear();
      for (const user of payload.users || []) this.users.set(user.id, user);
    }
    if (type === "user.joined") this.users.set(payload.id, payload);
    if (type === "user.left") this.users.delete(payload.id);
    if (type === "avatar.move") {
      const user = this.users.get(payload.id);
      if (user) Object.assign(user, { x: payload.x, y: payload.y });
    }
    this.emit(message);
  }
}
