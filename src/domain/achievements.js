/**
 * Achievements / badges for eWorld activities.
 */

import { pushNotification } from "./notifications.js";
import { credit, ensureWallet } from "./currency.js";

export const ACHIEVEMENT_DEFS = Object.freeze([
  // —— Social ——
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
    id: "feed_poster",
    title: "Голос сети",
    description: "Опубликуйте пост в ленте",
    category: "social",
    points: 10,
    rewardYc: 3
  },

  // —— Games (core) ——
  {
    id: "first_match",
    title: "Дебют",
    description: "Сыграйте первую партию",
    category: "games",
    points: 15,
    rewardYc: 5
  },
  {
    id: "matches_10",
    title: "Завсегдатай стола",
    description: "Сыграйте 10 партий",
    category: "games",
    points: 25,
    rewardYc: 10
  },
  {
    id: "matches_50",
    title: "Ветеран игр",
    description: "Сыграйте 50 партий",
    category: "games",
    points: 60,
    rewardYc: 25
  },
  {
    id: "wins_5",
    title: "Пятёрка побед",
    description: "Выиграйте 5 партий",
    category: "games",
    points: 20,
    rewardYc: 8
  },
  {
    id: "wins_15",
    title: "Серия побед",
    description: "Выиграйте 15 партий",
    category: "games",
    points: 40,
    rewardYc: 15
  },
  {
    id: "wins_30",
    title: "Мастер стола",
    description: "Выиграйте 30 партий",
    category: "games",
    points: 70,
    rewardYc: 30
  },

  // —— Games by title ——
  {
    id: "chess_win",
    title: "Шах и мат",
    description: "Выиграйте партию в шахматы",
    category: "games",
    points: 20,
    rewardYc: 8
  },
  {
    id: "chess_wins_5",
    title: "Шахматист",
    description: "5 побед в шахматы",
    category: "games",
    points: 35,
    rewardYc: 12
  },
  {
    id: "checkers_win",
    title: "Дамка",
    description: "Выиграйте партию в шашки",
    category: "games",
    points: 20,
    rewardYc: 8
  },
  {
    id: "checkers_wins_5",
    title: "Шашист",
    description: "5 побед в шашки",
    category: "games",
    points: 35,
    rewardYc: 12
  },
  {
    id: "monopoly_play",
    title: "Монополист-новичок",
    description: "Сыграйте партию в монополию",
    category: "games",
    points: 15,
    rewardYc: 5
  },
  {
    id: "monopoly_win",
    title: "Король недвижимости",
    description: "Выиграйте партию в монополию",
    category: "games",
    points: 30,
    rewardYc: 12
  },
  {
    id: "tictactoe_win",
    title: "Крест накрест",
    description: "Выиграйте в крестики-нолики",
    category: "games",
    points: 12,
    rewardYc: 4
  },
  {
    id: "tictactoe_wins_10",
    title: "Ноликовый стратег",
    description: "10 побед в крестики-нолики",
    category: "games",
    points: 28,
    rewardYc: 10
  },
  {
    id: "reversi_win",
    title: "Переворот",
    description: "Выиграйте партию в реверси",
    category: "games",
    points: 20,
    rewardYc: 8
  },

  // —— Tournaments & breadth ——
  {
    id: "tournament_join",
    title: "Участник кубка",
    description: "Запишитесь на турнир",
    category: "games",
    points: 15,
    rewardYc: 5
  },
  {
    id: "tournament_host",
    title: "Организатор",
    description: "Создайте и запустите турнир",
    category: "games",
    points: 25,
    rewardYc: 10
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
    id: "polyglot_gamer",
    title: "Универсал",
    description: "Сыграйте во все 5 игр каталога",
    category: "games",
    points: 45,
    rewardYc: 20
  },
  {
    id: "rated_win",
    title: "Рейтинговая победа",
    description: "Выиграйте рейтинговую партию",
    category: "games",
    points: 18,
    rewardYc: 7
  },

  // —— Other domains ——
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
  }
]);

function defById(id) {
  return ACHIEVEMENT_DEFS.find((a) => a.id === id) || null;
}

export function createAchievementsState(seed = {}) {
  return {
    unlocked: seed.unlocked && typeof seed.unlocked === "object"
      ? Object.fromEntries(
          Object.entries(seed.unlocked).map(([uid, map]) => [
            uid,
            map && typeof map === "object" ? { ...map } : {}
          ])
        )
      : {},
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

export function listGameAchievements() {
  return ACHIEVEMENT_DEFS.filter((a) => a.category === "games").map((a) => ({ ...a }));
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

  // social / other
  if (key === "friends" && n >= 1) tryUnlock("first_friend");
  if (key === "friends" && n >= 5) tryUnlock("social_butterfly");
  if (key === "messages_sent" && n >= 1) tryUnlock("first_message");
  if (key === "sales" && n >= 1) tryUnlock("first_sale");
  if (key === "gym" && n >= 1) tryUnlock("gym_regular");
  if (key === "yoga" && n >= 1) tryUnlock("yoga_aura");
  if (key === "school" && n >= 1) tryUnlock("school_ready");
  if (key === "verified" && n >= 1) tryUnlock("verified");
  if (key === "anon_browser" && n >= 1) tryUnlock("browser_privacy");
  if (key === "feed_posts" && n >= 1) tryUnlock("feed_poster");

  // games — volume
  if (key === "matches" && n >= 1) tryUnlock("first_match");
  if (key === "matches" && n >= 10) tryUnlock("matches_10");
  if (key === "matches" && n >= 50) tryUnlock("matches_50");
  if (key === "wins" && n >= 5) tryUnlock("wins_5");
  if (key === "wins" && n >= 15) tryUnlock("wins_15");
  if (key === "wins" && n >= 30) tryUnlock("wins_30");

  // games — by title
  if (key === "chess_wins" && n >= 1) tryUnlock("chess_win");
  if (key === "chess_wins" && n >= 5) tryUnlock("chess_wins_5");
  if (key === "checkers_wins" && n >= 1) tryUnlock("checkers_win");
  if (key === "checkers_wins" && n >= 5) tryUnlock("checkers_wins_5");
  if (key === "monopoly_plays" && n >= 1) tryUnlock("monopoly_play");
  if (key === "monopoly_wins" && n >= 1) tryUnlock("monopoly_win");
  if (key === "tictactoe_wins" && n >= 1) tryUnlock("tictactoe_win");
  if (key === "tictactoe_wins" && n >= 10) tryUnlock("tictactoe_wins_10");
  if (key === "reversi_wins" && n >= 1) tryUnlock("reversi_win");

  // tournaments
  if (key === "tournament_joins" && n >= 1) tryUnlock("tournament_join");
  if (key === "tournament_hosts" && n >= 1) tryUnlock("tournament_host");
  if (key === "tournament_wins" && n >= 1) tryUnlock("tournament_champ");

  if (key === "rated_wins" && n >= 1) tryUnlock("rated_win");

  // polyglot: played_* flags
  if (key.startsWith("played_")) {
    const types = ["chess", "checkers", "monopoly", "tictactoe", "reversi"];
    const all = types.every((g) => (Number(state.progress[id][`played_${g}`]) || 0) >= 1);
    if (all) tryUnlock("polyglot_gamer");
  }

  return { ok: true, value: n, unlocked };
}

/**
 * High-level hook for games domain after a match ends or starts.
 * @param {object} opts
 * @param {string} opts.gameId - chess | checkers | monopoly | tictactoe | reversi
 * @param {'win'|'loss'|'draw'|'play'} [opts.result]
 * @param {boolean} [opts.rated]
 * @param {boolean} [opts.tournamentWin]
 * @param {boolean} [opts.tournamentJoin]
 * @param {boolean} [opts.tournamentHost]
 */
export function recordGameEvent(state, userId, opts = {}, hooks = {}) {
  const gameId = String(opts.gameId || "");
  const unlocked = [];
  const merge = (r) => {
    if (r.unlocked) unlocked.push(...r.unlocked);
  };

  if (gameId) {
    merge(bumpProgress(state, userId, `played_${gameId}`, 1, hooks));
  }

  const result = opts.result || "play";
  if (result === "play" || result === "win" || result === "loss" || result === "draw") {
    merge(bumpProgress(state, userId, "matches", 1, hooks));
  }
  if (gameId === "monopoly" && (result === "play" || result === "win" || result === "loss")) {
    merge(bumpProgress(state, userId, "monopoly_plays", 1, hooks));
  }

  if (result === "win") {
    merge(bumpProgress(state, userId, "wins", 1, hooks));
    if (gameId === "chess") merge(bumpProgress(state, userId, "chess_wins", 1, hooks));
    if (gameId === "checkers") merge(bumpProgress(state, userId, "checkers_wins", 1, hooks));
    if (gameId === "monopoly") merge(bumpProgress(state, userId, "monopoly_wins", 1, hooks));
    if (gameId === "tictactoe") merge(bumpProgress(state, userId, "tictactoe_wins", 1, hooks));
    if (gameId === "reversi") merge(bumpProgress(state, userId, "reversi_wins", 1, hooks));
    if (opts.rated) merge(bumpProgress(state, userId, "rated_wins", 1, hooks));
  }

  if (opts.tournamentJoin) merge(bumpProgress(state, userId, "tournament_joins", 1, hooks));
  if (opts.tournamentHost) merge(bumpProgress(state, userId, "tournament_hosts", 1, hooks));
  if (opts.tournamentWin) merge(bumpProgress(state, userId, "tournament_wins", 1, hooks));

  return { ok: true, unlocked: [...new Set(unlocked)] };
}

export function totalPoints(state, userId) {
  const list = listUserAchievements(state, userId);
  return list.filter((a) => a.unlocked).reduce((s, a) => s + a.points, 0);
}

export function summarizeAchievements(state, userId = "local") {
  const list = listUserAchievements(state, userId);
  const n = list.filter((a) => a.unlocked).length;
  const games = list.filter((a) => a.category === "games" && a.unlocked).length;
  const gamesTotal = list.filter((a) => a.category === "games").length;
  return `${n}/${list.length} badges · games ${games}/${gamesTotal} · ${totalPoints(state, userId)} pts`;
}
