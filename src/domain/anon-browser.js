/**
 * Anonymous in-world browser.
 *
 * UX metaphor: Tor-like private session when the avatar uses a computer.
 * - No long-term profile linkage of history (session-scoped, wipeable)
 * - Search against an in-world knowledge index (not a real open web proxy)
 * - Does not implement real Tor circuits or unrestricted internet egress
 */

import { sanitizeText } from "./security.js";

export const BROWSER_MODES = Object.freeze(["standard", "anonymous"]);

/** Max tabs / history entries per session. */
export const MAX_TABS = 8;
export const MAX_HISTORY = 40;
export const MAX_RESULTS = 12;

/** Distance (world units) to interact with a computer object. */
export const COMPUTER_INTERACT_RADIUS = 55;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Curated in-world knowledge base for search (safe, educational, product docs). */
export const KNOWLEDGE_INDEX = Object.freeze([
  {
    id: "yc",
    title: "Югатн-коин (YC)",
    url: "eworld://wiki/currency-yc",
    tags: ["валюта", "yc", "оплата", "кошелёк", "money"],
    snippet: "Внутренняя символическая валюта eWorld. Не является фиатом."
  },
  {
    id: "marketplace",
    title: "Маркетплейс (объявления)",
    url: "eworld://wiki/marketplace",
    tags: ["авито", "продажа", "объявления", "marketplace", "сделки"],
    snippet: "C2C-объявления: продажа вещей, эскроу YC, рейтинг продавца."
  },
  {
    id: "escrow",
    title: "Безопасная сделка и эскроу",
    url: "eworld://wiki/payments-escrow",
    tags: ["эскроу", "оплата", "возврат", "escrow", "холд"],
    snippet: "Деньги на холде до подтверждения получения или авто-релиза."
  },
  {
    id: "crypto-p2p",
    title: "Крипто и P2P-обмен",
    url: "eworld://wiki/crypto-p2p",
    tags: ["крипта", "usdt", "p2p", "обменник", "bitcoin"],
    snippet: "Доменная модель оплаты криптой и P2P-офферов. Без on-chain ключей."
  },
  {
    id: "school",
    title: "Школьный режим",
    url: "eworld://wiki/school-mode",
    tags: ["школа", "учитель", "расписание", "класс", "school"],
    snippet: "Роли ученика/учителя/админа, расписание, доска объявлений."
  },
  {
    id: "health",
    title: "Здоровье аватара",
    url: "eworld://wiki/health",
    tags: ["здоровье", "болезнь", "врач", "аптечка", "health"],
    snippet: "Система самочувствия, лечения и отдыха в квартире."
  },
  {
    id: "wellness",
    title: "Фитнес и йога",
    url: "eworld://wiki/wellness",
    tags: ["фитнес", "йога", "тренировка", "аура", "gym"],
    snippet: "Согласие на данные, тонус тела и йога-аура аватара."
  },
  {
    id: "privacy",
    title: "Приватность и безопасность",
    url: "eworld://wiki/security",
    tags: ["приватность", "безопасность", "owasp", "аноним", "privacy"],
    snippet: "Классификация данных, аудит, rate limit, анонимный браузер."
  },
  {
    id: "avatar",
    title: "Аватар: одежда и внешность",
    url: "eworld://wiki/avatar",
    tags: ["аватар", "одежда", "внешность", "магазин", "nft"],
    snippet: "Гардероб, временные эффекты, магазин и секонд-хенд."
  },
  {
    id: "rooms",
    title: "Комнаты квартиры",
    url: "eworld://wiki/rooms",
    tags: ["гостиная", "кухня", "детская", "ванная", "кабинет"],
    snippet: "Гостиная, кухня, спальня, ванная, кабинет, детская."
  },
  {
    id: "smart-home",
    title: "Умный дом",
    url: "eworld://wiki/smart-home",
    tags: ["умный дом", "свет", "климат", "телевизор", "smarthome"],
    snippet: "Свет, климат, ТВ и музыка в комнатах."
  },
  {
    id: "voice",
    title: "Голосовые команды",
    url: "eworld://wiki/voice",
    tags: ["голос", "команды", "voice", "помощь"],
    snippet: "Русские и английские голосовые команды для навигации и действий."
  },
  {
    id: "anon-browser",
    title: "Анонимный браузер",
    url: "eworld://wiki/anon-browser",
    tags: ["браузер", "аноним", "tor", "поиск", "browser"],
    snippet: "Приватный поиск у компьютера: сессия без привязки истории к профилю."
  },
  {
    id: "podcasts",
    title: "Подкасты и эфиры",
    url: "eworld://wiki/podcasts",
    tags: ["подкаст", "эфир", "трансляция", "podcast"],
    snippet: "Прослушивание и живые трансляции в гостиной."
  },
  {
    id: "voting",
    title: "Голосования",
    url: "eworld://wiki/voting",
    tags: ["голосование", "опрос", "vote", "верификация"],
    snippet: "Опросы; официальные голоса требуют верификации."
  }
]);

export function createAnonBrowserState(seed = {}) {
  return {
    /** active sessions by sessionId */
    sessions: seed.sessions && typeof seed.sessions === "object"
      ? Object.fromEntries(
          Object.entries(seed.sessions).map(([k, v]) => [k, cloneSession(v)])
        )
      : {},
    /** optional: last closed summary (no query text stored long-term) */
    stats: {
      sessionsOpened: Number(seed.stats?.sessionsOpened) || 0,
      searchesRun: Number(seed.stats?.searchesRun) || 0,
      pagesOpened: Number(seed.stats?.pagesOpened) || 0
    }
  };
}

function cloneSession(s) {
  return {
    ...s,
    tabs: Array.isArray(s.tabs) ? s.tabs.map((t) => ({ ...t })) : [],
    history: Array.isArray(s.history) ? s.history.map((h) => ({ ...h })) : [],
    lastResults: Array.isArray(s.lastResults)
      ? s.lastResults.map((r) => ({ ...r }))
      : []
  };
}

function emptyTab(url = "eworld://home", title = "Start") {
  return {
    id: uid("tab"),
    url,
    title,
    loadedAt: Date.now()
  };
}

/**
 * Objects that can host the browser (laptop / study laptop / etc.).
 */
export function isComputerObject(obj) {
  if (!obj) return false;
  const caps = obj.capabilities || [];
  if (caps.includes("browser.anonymous") || caps.includes("browser.open")) return true;
  return obj.type === "laptop" || obj.id === "laptop" || obj.id === "study-laptop";
}

export function findNearestComputer(world, avatarPos, {
  maxDist = COMPUTER_INTERACT_RADIUS
} = {}) {
  const objects = world?.objects || [];
  let best = null;
  let bestD = Infinity;
  for (const o of objects) {
    if (!isComputerObject(o)) continue;
    const d = Math.hypot((avatarPos?.x ?? 0) - o.x, (avatarPos?.y ?? 0) - o.y);
    if (d <= maxDist && d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best ? { object: best, distance: bestD } : null;
}

/**
 * Open anonymous browser session at a computer.
 * history is session-only and wiped on close / new circuit.
 */
export function openBrowser(state, {
  userId = "local",
  computerId = "laptop",
  mode = "anonymous",
  requireNear = false,
  nearOk = true
} = {}) {
  if (requireNear && !nearOk) {
    return { ok: false, reason: "too_far", message: "Подойдите ближе к компьютеру" };
  }
  const m = BROWSER_MODES.includes(mode) ? mode : "anonymous";
  const sessionId = uid("brs");
  const session = {
    id: sessionId,
    userId: String(userId),
    computerId: String(computerId),
    mode: m,
    /** ephemeral circuit id — changes on "new identity" */
    circuitId: uid("cir"),
    tabs: [emptyTab("eworld://home", "Анонимный старт")],
    activeTabIndex: 0,
    history: [],
    lastQuery: null,
    lastResults: [],
    cookiesCleared: true,
    openedAt: Date.now(),
    lastActiveAt: Date.now()
  };
  state.sessions[sessionId] = session;
  state.stats.sessionsOpened += 1;
  return { ok: true, session: publicSession(session) };
}

function publicSession(session) {
  return {
    id: session.id,
    userId: session.userId,
    computerId: session.computerId,
    mode: session.mode,
    circuitId: session.circuitId,
    tabs: session.tabs.map((t) => ({ ...t })),
    activeTabIndex: session.activeTabIndex,
    historyCount: session.history.length,
    lastQuery: session.lastQuery,
    lastResults: session.lastResults.map((r) => ({ ...r })),
    cookiesCleared: session.cookiesCleared,
    openedAt: session.openedAt,
    lastActiveAt: session.lastActiveAt
  };
}

export function getSession(state, sessionId) {
  const s = state.sessions[sessionId];
  return s ? publicSession(s) : null;
}

export function listUserSessions(state, userId) {
  return Object.values(state.sessions)
    .filter((s) => s.userId === String(userId))
    .map((s) => publicSession(s));
}

export function closeBrowser(state, sessionId) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  // wipe — do not retain query text in global stats
  delete state.sessions[sessionId];
  return { ok: true, wiped: true };
}

/** New circuit: clear history, cookies metaphor, new circuit id, keep window open. */
export function newCircuit(state, sessionId) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  s.circuitId = uid("cir");
  s.history = [];
  s.lastQuery = null;
  s.lastResults = [];
  s.cookiesCleared = true;
  s.tabs = [emptyTab("eworld://home", "Новая цепочка")];
  s.activeTabIndex = 0;
  s.lastActiveAt = Date.now();
  return { ok: true, session: publicSession(s) };
}

export function clearHistory(state, sessionId) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  s.history = [];
  s.lastQuery = null;
  s.lastResults = [];
  s.lastActiveAt = Date.now();
  return { ok: true, session: publicSession(s) };
}

export function search(state, sessionId, query) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };

  const q = sanitizeText(query, { maxLen: 120 }).trim().toLowerCase();
  if (q.length < 1) return { ok: false, reason: "empty_query" };

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const page of KNOWLEDGE_INDEX) {
    let score = 0;
    const hay = (
      page.title +
      " " +
      page.snippet +
      " " +
      (page.tags || []).join(" ")
    ).toLowerCase();
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
      if ((page.tags || []).some((tag) => tag.toLowerCase().includes(t))) score += 3;
      if (page.title.toLowerCase().includes(t)) score += 4;
    }
    if (score > 0) scored.push({ page, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, MAX_RESULTS).map(({ page, score }) => ({
    id: page.id,
    title: page.title,
    url: page.url,
    snippet: page.snippet,
    score
  }));

  s.lastQuery = q;
  s.lastResults = results;
  s.history.push({
    at: Date.now(),
    type: "search",
    query: q,
    resultCount: results.length
  });
  if (s.history.length > MAX_HISTORY) s.history = s.history.slice(-MAX_HISTORY);
  s.lastActiveAt = Date.now();
  state.stats.searchesRun += 1;

  return { ok: true, query: q, results, session: publicSession(s) };
}

export function openPage(state, sessionId, pageIdOrUrl) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };

  const key = String(pageIdOrUrl);
  let page =
    KNOWLEDGE_INDEX.find((p) => p.id === key) ||
    KNOWLEDGE_INDEX.find((p) => p.url === key);

  if (!page && key.startsWith("eworld://")) {
    page = {
      id: "raw",
      title: key,
      url: key,
      snippet: "Страница внутренней сети eWorld."
    };
  }
  if (!page) return { ok: false, reason: "not_found_page" };

  const tab = emptyTab(page.url, page.title);
  if (s.tabs.length >= MAX_TABS) {
    s.tabs.shift();
    s.activeTabIndex = Math.max(0, s.activeTabIndex - 1);
  }
  s.tabs.push(tab);
  s.activeTabIndex = s.tabs.length - 1;
  s.history.push({
    at: Date.now(),
    type: "navigate",
    url: page.url,
    title: page.title
  });
  if (s.history.length > MAX_HISTORY) s.history = s.history.slice(-MAX_HISTORY);
  s.lastActiveAt = Date.now();
  state.stats.pagesOpened += 1;

  return {
    ok: true,
    page: {
      id: page.id,
      title: page.title,
      url: page.url,
      body: page.snippet + "\n\n(Содержимое справочника eWorld.)"
    },
    session: publicSession(s)
  };
}

export function closeTab(state, sessionId, tabIndex) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  const i = Number(tabIndex);
  if (!Number.isInteger(i) || i < 0 || i >= s.tabs.length) {
    return { ok: false, reason: "bad_tab" };
  }
  s.tabs.splice(i, 1);
  if (!s.tabs.length) s.tabs.push(emptyTab());
  s.activeTabIndex = Math.min(s.activeTabIndex, s.tabs.length - 1);
  s.lastActiveAt = Date.now();
  return { ok: true, session: publicSession(s) };
}

export function setActiveTab(state, sessionId, tabIndex) {
  const s = state.sessions[sessionId];
  if (!s) return { ok: false, reason: "not_found" };
  const i = Number(tabIndex);
  if (!Number.isInteger(i) || i < 0 || i >= s.tabs.length) {
    return { ok: false, reason: "bad_tab" };
  }
  s.activeTabIndex = i;
  s.lastActiveAt = Date.now();
  return { ok: true, session: publicSession(s) };
}

/**
 * High-level: avatar near computer → open anonymous browser.
 */
export function openAtComputer(state, world, {
  userId = "local",
  maxDist = COMPUTER_INTERACT_RADIUS
} = {}) {
  const pos = world?.avatar || { x: 0, y: 0 };
  const near = findNearestComputer(world, pos, { maxDist });
  if (!near) {
    return {
      ok: false,
      reason: "no_computer_nearby",
      message: "Подойдите к компьютеру (ноутбук в гостиной или кабинете)"
    };
  }
  return openBrowser(state, {
    userId,
    computerId: near.object.id,
    mode: "anonymous",
    requireNear: true,
    nearOk: true
  });
}

export function summarizeAnonBrowser(state) {
  const n = Object.keys(state.sessions).length;
  return `${n} open · searches ${state.stats.searchesRun} · pages ${state.stats.pagesOpened}`;
}
