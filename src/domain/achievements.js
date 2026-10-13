/**
 * Achievements / badges for eWorld activities.
 */

import { sanitizeText } from "./security.js";
import { pushNotification } from "./notifications.js";
import { credit, ensureWallet } from "./currency.js";

export const ACHIEVEMENT_DEFS = Object.freeze([
  {
    id: "first_friend",
    title: "Первый друг",
    description: "Добавьте первого друга",
    category: "social",
    points: 10,
    rewardYc: 5
  },
  {
    id: "social_butterfly",
    title: "Душа компании",
    description: "5 друзей",
    category: "social",
    points: 25,
    rewardYc: 10
  },
  {
    id: "first_message",
    title: "Первое письмо",
    description: "Отправьте личное сообщение",
    category: "social",
    points: 10,
    rewardYc: 3
  },
  {
    id: "first_match",
    title: "Дебют",
    description: "Сыграйте первую партию",
    category: "games",
    points: 15,
    rewardYc: 5
  },
  {
    id: "chess_win",
    title: "Шах и мат",
    description: "Выиграйте партию в шахматы",
    category: "games",
    points: 20,
    rewardYc: 8
  },
  {
    id: "tournament_champ",
    title: "Чемпион турнира",
    description: "Победите в турнире",
    category: "games",
    points: 50,
    rewardYc: 25
  },
  {
    id: "first_sale",
    title: "Продавец",
    description: "Продайте товар на маркетплейсе",
    category: "commerce",
    points: 15,
    rewardYc: 5
  },
  {
    id: "gym_regular",
    title: "В зале",
    description: "Отметьте тренировку",
    category: "wellness",
    points: 15,
    rewardYc: 5
  },
  {
    id: "yoga_aura",
    title: "Йога-аура",
    description: "Занятие йогой",
    category: "wellness",
    points: 15,
    rewardYc: 5
  },
  {
    id: "school_ready",
    title: "В школу",
    description: "Войдите в школьный режим",
    category: "school",
    points: 10,
    rewardYc: 3
  },
  {
    id: "verified",
    title: "Верифицирован",
    description: "Пройдите верификацию личности",
    category: "identity",
    points: 30,
    rewardYc: 15
  },
  {
    id: "browser_privacy",
    title: "Приватный серфер",
    description: "Откройте анонимный браузер",
    category: "privacy",
    points: 10,
    rewardYc: 2
  },
  {
    id: "feed_poster",
    title: "Голос сети",
    description: "Опубликуйте пост в ленте",
    category: "social",
    points: 10,
    rewardYc: 3
  }
]);

function defById(id) {
  return ACHIEVEMENT_DEFS.find((a) => a.id === id) || null;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createAchievementsState(seed = {}) {
  return {
    /** userId → { [achievementId]: { unlockedAt, claimed } } */
    unlocked: seed.unlocked && typeof seed.unlocked === "object"
      ? Object.fromEntries(
          Object.entries(seed.unlocked).map(([uid, map]) => [
            uid,
            map && typeof map === "object" ? { ...map } : {}
          ])
        )
      : {},
    /** counters userId → { friends: n, matches: n, ... } */
    progress: seed.progress && typeof seed.progress === "object"
      ? Object.fromEntries(
          Object.entries(seed.progress).map(([uid, p]) => [uid, { ...p }])
        )
      : {}
  };
}

function ensureUser(state, userId) {
  const id = String(userId);
  if (!state.unlocked[id]) state.unlocked[id] = {};
  if (!state.progress[id]) state.progress[id] = {};
  return id;
}

export function listAchievementDefs() {
  return ACHIEVEMENT_DEFS.map((a) => ({ ...a }));
}

export function listUserAchievements(state, userId) {
  const id = String(userId);
  const map = state.unlocked[id] || {};
  return ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: Boolean(map[def.id]),
    unlockedAt: map[def.id]?.unlockedAt || null,
    claimed: Boolean(map[def.id]?.claimed)
  }));
}

export function unlockAchievement(state, userId, achievementId, {
  notifyState = null,
  currencyState = null,
  autoClaim = true
} = {}) {
  const def = defById(achievementId);
  if (!def) return { ok: false, reason: "unknown" };
  const id = ensureUser(state, userId);
  if (state.unlocked[id][achievementId]) {
    return { ok: false, reason: "already", achievement: def };
  }
  state.unlocked[id][achievementId] = {
    unlockedAt: Date.now(),
    claimed: false
  };
  if (notifyState) {
    pushNotification(notifyState, {
      userId: id,
      type: "system",
      title: `Достижение: ${def.title}`,
      body: def.description,
      refType: "achievement",
      refId: achievementId
    });
  }
  let reward = null;
  if (autoClaim && def.rewardYc && currencyState) {
    reward = claimAchievementReward(state, currencyState, id, achievementId);
  }
  return {
    ok: true,
    achievement: def,
    reward: reward?.ok ? reward : null
  };
}

export function claimAchievementReward(state, currencyState, userId, achievementId) {
  const def = defById(achievementId);
  if (!def) return { ok: false, reason: "unknown" };
  const id = String(userId);
  const entry = state.unlocked[id]?.[achievementId];
  if (!entry) return { ok: false, reason: "not_unlocked" };
  if (entry.claimed) return { ok: false, reason: "already_claimed" };
  if (!def.rewardYc) {
    entry.claimed = true;
    return { ok: true, amount: 0 };
  }
  ensureWallet(currencyState, id);
  credit(currencyState, id, def.rewardYc, {
    type: "reward",
    note: `achievement:${achievementId}`
  });
  entry.claimed = true;
  return { ok: true, amount: def.rewardYc };
}

/** Increment progress counter and auto-unlock when thresholds met. */
export function bumpProgress(state, userId, key, delta = 1, hooks = {}) {
  const id = ensureUser(state, userId);
  const prev = Number(state.progress[id][key]) || 0;
  state.progress[id][key] = prev + delta;
  const n = state.progress[id][key];
  const unlocked = [];

  const tryUnlock = (aid) => {
    const r = unlockAchievement(state, id, aid, hooks);
    if (r.ok) unlocked.push(aid);
  };

  if (key === "friends" && n >= 1) tryUnlock("first_friend");
  if (key === "friends" && n >= 5) tryUnlock("social_butterfly");
  if (key === "messages_sent" && n >= 1) tryUnlock("first_message");
  if (key === "matches" && n >= 1) tryUnlock("first_match");
  if (key === "chess_wins" && n >= 1) tryUnlock("chess_win");
  if (key === "tournament_wins" && n >= 1) tryUnlock("tournament_champ");
  if (key === "sales" && n >= 1) tryUnlock("first_sale");
  if (key === "gym" && n >= 1) tryUnlock("gym_regular");
  if (key === "yoga" && n >= 1) tryUnlock("yoga_aura");
  if (key === "school" && n >= 1) tryUnlock("school_ready");
  if (key === "verified" && n >= 1) tryUnlock("verified");
  if (key === "anon_browser" && n >= 1) tryUnlock("browser_privacy");
  if (key === "feed_posts" && n >= 1) tryUnlock("feed_poster");

  return { ok: true, value: n, unlocked };
}

export function totalPoints(state, userId) {
  const list = listUserAchievements(state, userId);
  return list.filter((a) => a.unlocked).reduce((s, a) => s + a.points, 0);
}

export function summarizeAchievements(state, userId = "local") {
  const list = listUserAchievements(state, userId);
  const n = list.filter((a) => a.unlocked).length;
  return `${n}/${list.length} badges · ${totalPoints(state, userId)} pts`;
}
