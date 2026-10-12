/**
 * Health & illness system for eWorld.
 * Vitals (energy, immunity, stress, hunger) + discrete illnesses.
 * Recovery via rest, home care, medicine, or completing a doctor visit.
 * Light coupling to avatar temps and wellness (gym blocked when severely ill).
 */

import { applyTemp, clearTemp } from "./avatar.js";

export const VITAL_KEYS = Object.freeze(["energy", "immunity", "stress", "hunger"]);

/** Catalog of conditions. severity 1–3. */
export const ILLNESS_CATALOG = Object.freeze({
  cold: {
    id: "cold",
    name: "Cold",
    nameRu: "Простуда",
    severity: 1,
    durationMs: 2 * 24 * 60 * 60 * 1000,
    symptoms: ["sneeze", "tired"],
    blocksGym: false,
    recoveryBoost: { rest: 1.2, medicine: 1.5, doctor: 2 }
  },
  flu: {
    id: "flu",
    name: "Flu",
    nameRu: "Грипп",
    severity: 2,
    durationMs: 4 * 24 * 60 * 60 * 1000,
    symptoms: ["fever", "tired", "ache"],
    blocksGym: true,
    recoveryBoost: { rest: 1.1, medicine: 1.6, doctor: 2.2 }
  },
  injury: {
    id: "injury",
    name: "Minor injury",
    nameRu: "Травма",
    severity: 2,
    durationMs: 5 * 24 * 60 * 60 * 1000,
    symptoms: ["ache"],
    blocksGym: true,
    recoveryBoost: { rest: 1.0, medicine: 1.3, doctor: 2.5 }
  },
  burnout: {
    id: "burnout",
    name: "Burnout",
    nameRu: "Выгорание",
    severity: 2,
    durationMs: 7 * 24 * 60 * 60 * 1000,
    symptoms: ["tired", "low_mood"],
    blocksGym: false,
    recoveryBoost: { rest: 1.4, medicine: 1.1, doctor: 1.8 }
  },
  foodborne: {
    id: "foodborne",
    name: "Food discomfort",
    nameRu: "Несварение",
    severity: 1,
    durationMs: 18 * 60 * 60 * 1000,
    symptoms: ["nausea"],
    blocksGym: false,
    recoveryBoost: { rest: 1.3, medicine: 1.7, doctor: 2 }
  }
});

export const HOME_REMEDIES = Object.freeze([
  { id: "rest", name: "Rest / sleep", nameRu: "Отдых / сон", kind: "rest" },
  { id: "tea", name: "Herbal tea", nameRu: "Травяной чай", kind: "medicine" },
  { id: "otc", name: "OTC medicine", nameRu: "Лекарство из аптечки", kind: "medicine" },
  { id: "bandage", name: "Bandage / ice", nameRu: "Бинт / лёд", kind: "medicine" }
]);

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createHealthState(seed = {}) {
  const vitals = seed.vitals && typeof seed.vitals === "object" ? seed.vitals : {};
  return {
    vitals: {
      energy: clamp(vitals.energy ?? 80),
      immunity: clamp(vitals.immunity ?? 70),
      stress: clamp(vitals.stress ?? 25),
      hunger: clamp(vitals.hunger ?? 30)
    },
    /** Active conditions: { id, illnessId, startedAt, severity, progress 0-100 (recovered) } */
    conditions: Array.isArray(seed.conditions)
      ? seed.conditions.map((c) => ({ ...c }))
      : [],
    history: Array.isArray(seed.history) ? seed.history.map((h) => ({ ...h })) : [],
    lastTickAt: seed.lastTickAt || 0
  };
}

export function getIllness(illnessId) {
  return ILLNESS_CATALOG[illnessId] || null;
}

export function listActiveConditions(state) {
  return state.conditions.map((c) => {
    const def = ILLNESS_CATALOG[c.illnessId];
    return {
      ...c,
      name: def?.name || c.illnessId,
      nameRu: def?.nameRu,
      blocksGym: def?.blocksGym || false,
      symptoms: def?.symptoms || []
    };
  });
}

export function isSeverelyIll(state) {
  return state.conditions.some((c) => {
    const def = ILLNESS_CATALOG[c.illnessId];
    return def && def.blocksGym && (c.progress || 0) < 80;
  });
}

export function canExercise(state) {
  return !isSeverelyIll(state);
}

/** Overall status label for UI. */
export function healthStatus(state) {
  if (state.conditions.length === 0) {
    if (state.vitals.energy >= 70 && state.vitals.stress <= 40) return "healthy";
    if (state.vitals.energy < 30 || state.vitals.stress > 75) return "strained";
    return "ok";
  }
  const maxSev = Math.max(
    ...state.conditions.map((c) => ILLNESS_CATALOG[c.illnessId]?.severity || 1)
  );
  if (maxSev >= 2) return "ill";
  return "under_the_weather";
}

/**
 * Catch an illness (or worsen vitals into risk).
 * High stress + low immunity increase chance when randomize is true.
 */
export function catchIllness(state, illnessId, { force = false, now = Date.now() } = {}) {
  const def = ILLNESS_CATALOG[illnessId];
  if (!def) return { ok: false, reason: "unknown_illness" };
  if (state.conditions.some((c) => c.illnessId === illnessId)) {
    return { ok: false, reason: "already_have" };
  }
  if (!force) {
    const risk =
      (100 - state.vitals.immunity) * 0.4 +
      state.vitals.stress * 0.3 +
      (state.vitals.energy < 40 ? 20 : 0);
    if (risk < 35) return { ok: false, reason: "resisted", risk };
  }
  const condition = {
    id: uid("ill"),
    illnessId,
    startedAt: now,
    severity: def.severity,
    progress: 0
  };
  state.conditions.push(condition);
  state.vitals.energy = clamp(state.vitals.energy - 10 * def.severity);
  state.vitals.immunity = clamp(state.vitals.immunity - 5);
  return { ok: true, condition, illness: def };
}

/** Apply home remedy or rest toward recovery. */
export function treatAtHome(state, remedyId, { conditionId = null, now = Date.now() } = {}) {
  const remedy = HOME_REMEDIES.find((r) => r.id === remedyId);
  if (!remedy) return { ok: false, reason: "unknown_remedy" };
  if (!state.conditions.length) {
    // still help vitals
    if (remedy.kind === "rest") {
      state.vitals.energy = clamp(state.vitals.energy + 15);
      state.vitals.stress = clamp(state.vitals.stress - 10);
    }
    return { ok: true, vitalsOnly: true, vitals: { ...state.vitals } };
  }
  const target =
    (conditionId && state.conditions.find((c) => c.id === conditionId)) ||
    state.conditions[0];
  if (!target) return { ok: false, reason: "no_condition" };
  const def = ILLNESS_CATALOG[target.illnessId];
  const boost = def?.recoveryBoost?.[remedy.kind] || 1;
  const gain = Math.round(12 * boost);
  target.progress = clamp(target.progress + gain, 0, 100);
  if (remedy.kind === "rest") {
    state.vitals.energy = clamp(state.vitals.energy + 10);
    state.vitals.stress = clamp(state.vitals.stress - 8);
  } else {
    state.vitals.immunity = clamp(state.vitals.immunity + 5);
  }
  const cured = maybeCompleteCondition(state, target, now);
  return {
    ok: true,
    progress: target.progress,
    cured,
    remedy: remedy.id,
    vitals: { ...state.vitals }
  };
}

function maybeCompleteCondition(state, condition, now) {
  if ((condition.progress || 0) < 100) return false;
  state.conditions = state.conditions.filter((c) => c.id !== condition.id);
  state.history.push({
    illnessId: condition.illnessId,
    recoveredAt: now,
    durationMs: now - condition.startedAt
  });
  if (state.history.length > 50) state.history = state.history.slice(-50);
  state.vitals.energy = clamp(state.vitals.energy + 10);
  state.vitals.immunity = clamp(state.vitals.immunity + 8);
  return true;
}

/**
 * Complete a booked doctor appointment → strong recovery on linked illness or general heal.
 * Call after wellness appointment is attended.
 */
export function healAtDoctor(state, {
  illnessId = null,
  conditionId = null,
  now = Date.now()
} = {}) {
  let target = null;
  if (conditionId) target = state.conditions.find((c) => c.id === conditionId);
  else if (illnessId) target = state.conditions.find((c) => c.illnessId === illnessId);
  else target = state.conditions.sort((a, b) => b.severity - a.severity)[0];

  if (target) {
    const def = ILLNESS_CATALOG[target.illnessId];
    const boost = def?.recoveryBoost?.doctor || 2;
    target.progress = clamp(target.progress + Math.round(40 * boost), 0, 100);
    const cured = maybeCompleteCondition(state, target, now);
    state.vitals.energy = clamp(state.vitals.energy + 15);
    state.vitals.immunity = clamp(state.vitals.immunity + 12);
    state.vitals.stress = clamp(state.vitals.stress - 10);
    return { ok: true, cured, progress: target.progress, vitals: { ...state.vitals } };
  }
  // preventive checkup
  state.vitals.immunity = clamp(state.vitals.immunity + 10);
  state.vitals.stress = clamp(state.vitals.stress - 5);
  return { ok: true, cured: false, preventive: true, vitals: { ...state.vitals } };
}

/** Passive tick: hunger up, energy down, slow natural recovery, stress drift. */
export function tickHealth(state, { hours = 1, now = Date.now() } = {}) {
  const h = Math.max(0.1, Number(hours) || 1);
  state.vitals.hunger = clamp(state.vitals.hunger + 3 * h);
  state.vitals.energy = clamp(state.vitals.energy - 2 * h + (state.vitals.hunger > 80 ? -3 * h : 0));
  state.vitals.stress = clamp(state.vitals.stress + (state.conditions.length ? 1 * h : -0.5 * h));
  // natural recovery on mild illness
  for (const c of [...state.conditions]) {
    const def = ILLNESS_CATALOG[c.illnessId];
    if (!def) continue;
    c.progress = clamp(c.progress + 2 * h * (def.recoveryBoost?.rest || 1), 0, 100);
    if (c.progress >= 100) maybeCompleteCondition(state, c, now);
  }
  state.lastTickAt = now;
  return { vitals: { ...state.vitals }, conditions: listActiveConditions(state) };
}

/** Eat / reduce hunger (from kitchen supplies flow). */
export function eatMeal(state, amount = 25) {
  state.vitals.hunger = clamp(state.vitals.hunger - amount);
  state.vitals.energy = clamp(state.vitals.energy + 8);
  return { ok: true, vitals: { ...state.vitals } };
}

export function restSleep(state, hours = 8) {
  const h = Math.max(1, Math.min(12, Number(hours) || 8));
  state.vitals.energy = clamp(state.vitals.energy + 8 * h);
  state.vitals.stress = clamp(state.vitals.stress - 4 * h);
  state.vitals.immunity = clamp(state.vitals.immunity + 1 * h);
  for (const c of state.conditions) {
    const def = ILLNESS_CATALOG[c.illnessId];
    c.progress = clamp(c.progress + 5 * h * (def?.recoveryBoost?.rest || 1), 0, 100);
  }
  const cured = [];
  for (const c of [...state.conditions]) {
    if (c.progress >= 100 && maybeCompleteCondition(state, c, Date.now())) {
      cured.push(c.illnessId);
    }
  }
  return { ok: true, vitals: { ...state.vitals }, cured };
}

/** Sync sick visuals onto avatar (temps). */
export function applyHealthToAvatar(state, avatarState, now = Date.now()) {
  if (!avatarState) return { ok: false };
  clearTemp(avatarState, "sick");
  clearTemp(avatarState, "fever");
  clearTemp(avatarState, "pale");
  const status = healthStatus(state);
  if (status === "ill" || status === "under_the_weather") {
    applyTemp(avatarState, "sick", now);
    const hasFever = state.conditions.some((c) =>
      (ILLNESS_CATALOG[c.illnessId]?.symptoms || []).includes("fever")
    );
    if (hasFever) applyTemp(avatarState, "fever", now);
    if (state.vitals.energy < 40) applyTemp(avatarState, "pale", now);
  } else if (state.vitals.energy < 25) {
    applyTemp(avatarState, "tired", now);
  }
  avatarState.health = {
    status,
    energy: state.vitals.energy,
    conditions: state.conditions.map((c) => c.illnessId)
  };
  return { ok: true, status };
}

export function summarizeHealth(state) {
  const st = healthStatus(state);
  const cond = state.conditions.map((c) => c.illnessId).join(",") || "none";
  return `${st} · E${state.vitals.energy}/I${state.vitals.immunity}/S${state.vitals.stress}/H${state.vitals.hunger} · ${cond}`;
}
