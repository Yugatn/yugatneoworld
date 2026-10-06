const KEY = "yugatn-eworld-v0.1";

export function loadWorld(fallback) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(fallback);
}

export function saveWorld(world) {
  localStorage.setItem(KEY, JSON.stringify(world));
}

export function resetWorld() {
  localStorage.removeItem(KEY);
}
