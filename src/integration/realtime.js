export class RealtimeWorld {
  constructor({ url = null, roomId = "apartment:demo", profile = {} } = {}) {
    this.url = url || (typeof location !== "undefined"
      ? (location.protocol === "https:" ? "wss://" : "ws://") + location.host
      : "ws://localhost:8080");
    this.roomId = roomId;
    this.profile = { name: profile.name || "Guest", avatar: profile.avatar || "default" };
    this.socket = null;
    this.id = null;
    this.color = null;
    this.users = new Map();
    this.listeners = new Set();
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._lastPosition = { x: 180, y: 220, scene: "apartment" };
    this._closedByUser = false;
  }
  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(event) { for (const listener of this.listeners) listener(event); }
  setProfile(profile) {
    this.profile = {
      name: String(profile.name || this.profile.name).slice(0, 24) || "Guest",
      avatar: String(profile.avatar || this.profile.avatar || "default").slice(0, 32)
    };
    this.send("profile.update", this.profile);
  }
  setRoom(roomId) { this.roomId = roomId; }
  connect(position = { x: 180, y: 220, scene: "apartment" }) {
    this._closedByUser = false;
    this._lastPosition = { x: position.x, y: position.y, scene: position.scene || "apartment" };
    if (this.socket && this.socket.readyState <= 1) return;
    this.emit({ type: "realtime.status", status: "connecting" });
    try { this.socket = new WebSocket(this.url); } catch {
      this.emit({ type: "realtime.status", status: "offline" });
      this._scheduleReconnect();
      return;
    }
    this.socket.addEventListener("open", () => {
      this._reconnectAttempts = 0;
      this.send("room.join", {
        roomId: this.roomId, x: this._lastPosition.x, y: this._lastPosition.y,
        scene: this._lastPosition.scene, profile: this.profile
      });
      this.emit({ type: "realtime.status", status: "online" });
    });
    this.socket.addEventListener("message", (event) => {
      let message; try { message = JSON.parse(event.data); } catch { return; }
      this.handle(message);
    });
    this.socket.addEventListener("close", () => {
      this.emit({ type: "realtime.status", status: "offline" });
      this._scheduleReconnect();
    });
    this.socket.addEventListener("error", () => this.emit({ type: "realtime.status", status: "error" }));
  }
  disconnect() {
    this._closedByUser = true;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    this.socket?.close();
  }
  _scheduleReconnect() {
    if (this._closedByUser) return;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    const delay = Math.min(15000, 800 * Math.pow(1.6, this._reconnectAttempts++));
    this._reconnectTimer = setTimeout(() => this.connect(this._lastPosition), delay);
  }
  send(type, payload = {}) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type, payload }));
  }
  move(x, y, scene = "apartment") {
    this._lastPosition = { x, y, scene };
    this.send("avatar.move", { x, y, scene });
  }
  changeScene(scene, x, y) {
    this._lastPosition = { x, y, scene };
    this.send("scene.change", { scene, x, y });
  }
  chat(text) { this.send("chat.message", { text }); }
  invite(targetId) { this.send("presence.invite", { targetId }); }
  proximity(targetId, objectId) { this.send("interaction.proximity", { targetId, objectId }); }
  rejoin(roomId, position) {
    this.roomId = roomId;
    this._lastPosition = position;
    this.send("room.join", {
      roomId, x: position.x, y: position.y,
      scene: position.scene || "apartment", profile: this.profile
    });
  }
  handle(message) {
    const { type, payload = {} } = message;
    if (type === "welcome") { this.id = payload.id; this.color = payload.color; }
    if (type === "room.snapshot") {
      this.users.clear();
      for (const user of payload.users || []) this.users.set(user.id, user);
      if (payload.self?.color) this.color = payload.self.color;
    }
    if (type === "user.joined") this.users.set(payload.id, payload);
    if (type === "user.left") this.users.delete(payload.id);
    if (type === "avatar.move") {
      const user = this.users.get(payload.id);
      if (user) Object.assign(user, { x: payload.x, y: payload.y, scene: payload.scene || user.scene });
    }
    if (type === "profile.update") {
      const user = this.users.get(payload.id);
      if (user) user.profile = payload.profile;
      if (payload.id === this.id) this.profile = payload.profile;
    }
    if (type === "scene.change") {
      const user = this.users.get(payload.id);
      if (user) Object.assign(user, { scene: payload.scene, x: payload.x, y: payload.y });
    }
    this.emit(message);
  }
}
