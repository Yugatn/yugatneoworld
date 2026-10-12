/**
 * Wellness: fitness centres, yoga, avatar body feedback, doctor booking.
 * Avatar body / yoga-aura updates ONLY when the user has given explicit consent.
 */

import { applyTemp, setBaseFeature } from "./avatar.js";

export const FITNESS_NETWORK = Object.freeze([
  {
    id: "gym-city",
    name: "City Fitness Center",
    nameRu: "Городской фитнес-центр",
    kind: "gym",
    official: true,
    networkId: "fit-network-1",
    cityPlaceId: "gym"
  },
  {
    id: "gym-partner-north",
    name: "North Partner Gym",
    nameRu: "Северный партнёрский зал",
    kind: "gym",
    official: true,
    networkId: "fit-network-1",
    cityPlaceId: null
  },
  {
    id: "yoga-city",
    name: "Official Yoga Center",
    nameRu: "Официальный йога-центр",
    kind: "yoga",
    official: true,
    networkId: "yoga-network-1",
    cityPlaceId: "yoga"
  },
  {
    id: "yoga-stream",
    name: "Official Yoga Live",
    nameRu: "Официальные йога-трансляции",
    kind: "yoga_stream",
    official: true,
    networkId: "yoga-network-1",
    cityPlaceId: null
  }
]);

export const DOCTOR_SPECIALTIES = Object.freeze([
  "gp",
  "therapist",
  "sports_medicine",
  "physiotherapy",
  "nutrition"
]);

/** Points needed to step body appearance (with consent). */
export const GYM_POINTS_PER_BODY_STEP = 5;
export const YOGA_POINTS_PER_AURA_STEP = 4;

export const BODY_PROGRESS = Object.freeze(["default", "toned", "athletic", "strong"]);
export const AURA_LEVELS = Object.freeze([0, 1, 2, 3, 4, 5]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createWellnessState(seed = {}) {
  return {
    /** Explicit consents — default false (privacy-first). */
    consent: {
      fitnessAffectsAvatar: Boolean(seed.consent?.fitnessAffectsAvatar),
      yogaAffectsAvatar: Boolean(seed.consent?.yogaAffectsAvatar),
      shareWithFitnessNetwork: Boolean(seed.consent?.shareWithFitnessNetwork),
      healthBooking: Boolean(seed.consent?.healthBooking),
      updatedAt: seed.consent?.updatedAt || 0
    },
    gymPoints: Number(seed.gymPoints) || 0,
    yogaPoints: Number(seed.yogaPoints) || 0,
    bodyStage: BODY_PROGRESS.includes(seed.bodyStage) ? seed.bodyStage : "default",
    yogaAura: Math.max(0, Math.min(5, Number(seed.yogaAura) || 0)),
    visits: Array.isArray(seed.visits) ? seed.visits.map((v) => ({ ...v })) : [],
    appointments: Array.isArray(seed.appointments)
      ? seed.appointments.map((a) => ({ ...a }))
      : [],
    linkedCenterIds: Array.isArray(seed.linkedCenterIds) ? [...seed.linkedCenterIds] : []
  };
}

export function setWellnessConsent(state, patch = {}) {
  const c = state.consent;
  if (typeof patch.fitnessAffectsAvatar === "boolean") c.fitnessAffectsAvatar = patch.fitnessAffectsAvatar;
  if (typeof patch.yogaAffectsAvatar === "boolean") c.yogaAffectsAvatar = patch.yogaAffectsAvatar;
  if (typeof patch.shareWithFitnessNetwork === "boolean") {
    c.shareWithFitnessNetwork = patch.shareWithFitnessNetwork;
  }
  if (typeof patch.healthBooking === "boolean") c.healthBooking = patch.healthBooking;
  c.updatedAt = Date.now();
  return { ok: true, consent: { ...c } };
}

export function listFitnessCenters({ kind, officialOnly = false } = {}) {
  let list = FITNESS_NETWORK.map((c) => ({ ...c }));
  if (kind) list = list.filter((c) => c.kind === kind || (kind === "yoga" && c.kind === "yoga_stream"));
  if (officialOnly) list = list.filter((c) => c.official);
  return list;
}

export function linkFitnessCenter(state, centerId) {
  const c = FITNESS_NETWORK.find((x) => x.id === centerId);
  if (!c) return { ok: false, reason: "unknown_center" };
  if (!state.consent.shareWithFitnessNetwork && c.networkId) {
    // Linking membership still allowed; sharing visit data is separate
  }
  if (!state.linkedCenterIds.includes(centerId)) state.linkedCenterIds.push(centerId);
  return { ok: true, center: { ...c }, linked: [...state.linkedCenterIds] };
}

function recordVisit(state, centerId, kind, minutes) {
  state.visits.push({
    id: uid("vis"),
    centerId,
    kind,
    minutes: Math.max(15, Math.min(180, Number(minutes) || 45)),
    at: Date.now()
  });
  // keep last 100
  if (state.visits.length > 100) state.visits = state.visits.slice(-100);
}

/** Map body stage → avatar base.body + optional muscleTone for renderer. */
function applyBodyToAvatar(avatarState, bodyStage, now) {
  if (!avatarState) return;
  // BODY_TYPES in avatar: default | slim | athletic — map strong→athletic
  const map = {
    default: "default",
    toned: "slim",
    athletic: "athletic",
    strong: "athletic"
  };
  const body = map[bodyStage] || "default";
  setBaseFeature(avatarState, "body", body);
  avatarState.fitness = avatarState.fitness || {};
  avatarState.fitness.bodyStage = bodyStage;
  avatarState.fitness.muscleTone = BODY_PROGRESS.indexOf(bodyStage);
  applyTemp(avatarState, "post_workout", now);
}

function applyAuraToAvatar(avatarState, auraLevel, now) {
  if (!avatarState) return;
  avatarState.fitness = avatarState.fitness || {};
  avatarState.fitness.yogaAura = auraLevel;
  if (auraLevel >= 1) applyTemp(avatarState, "yoga_aura", now);
}

/**
 * Check in / complete a gym session at an official fitness centre.
 * With consent.fitnessAffectsAvatar, raises gymPoints and may upgrade bodyStage.
 */
export function completeGymSession(state, avatarState, {
  centerId = "gym-city",
  minutes = 45,
  now = Date.now()
} = {}) {
  const center = FITNESS_NETWORK.find((c) => c.id === centerId && c.kind === "gym");
  if (!center || !center.official) return { ok: false, reason: "not_official_gym" };

  recordVisit(state, centerId, "gym", minutes);
  const gained = Math.max(1, Math.round(minutes / 30));
  state.gymPoints += gained;

  let bodyChanged = false;
  let previousStage = state.bodyStage;
  if (state.consent.fitnessAffectsAvatar) {
    const stageIdx = BODY_PROGRESS.indexOf(state.bodyStage);
    const nextIdx = Math.min(
      BODY_PROGRESS.length - 1,
      Math.floor(state.gymPoints / GYM_POINTS_PER_BODY_STEP)
    );
    if (nextIdx > stageIdx) {
      state.bodyStage = BODY_PROGRESS[nextIdx];
      bodyChanged = true;
    }
    applyBodyToAvatar(avatarState, state.bodyStage, now);
  }

  return {
    ok: true,
    gained,
    gymPoints: state.gymPoints,
    bodyStage: state.bodyStage,
    bodyChanged,
    previousStage,
    consentUsed: state.consent.fitnessAffectsAvatar,
    message: state.consent.fitnessAffectsAvatar
      ? bodyChanged
        ? `Workout logged. Avatar body → ${state.bodyStage}.`
        : `Workout logged (+${gained} pts). Keep training for the next body step.`
      : `Workout logged. Enable fitness→avatar consent to reflect progress on your avatar.`
  };
}

/**
 * Yoga at official center or official live stream.
 */
export function completeYogaSession(state, avatarState, {
  centerId = "yoga-city",
  minutes = 45,
  viaStream = false,
  now = Date.now()
} = {}) {
  let center = FITNESS_NETWORK.find((c) => c.id === centerId);
  if (viaStream) center = FITNESS_NETWORK.find((c) => c.kind === "yoga_stream") || center;
  if (!center || !center.official) return { ok: false, reason: "not_official_yoga" };
  if (center.kind !== "yoga" && center.kind !== "yoga_stream") {
    return { ok: false, reason: "not_yoga" };
  }

  recordVisit(state, center.id, center.kind, minutes);
  const gained = Math.max(1, Math.round(minutes / 30));
  state.yogaPoints += gained;

  let auraChanged = false;
  const prevAura = state.yogaAura;
  if (state.consent.yogaAffectsAvatar) {
    const nextAura = Math.min(5, Math.floor(state.yogaPoints / YOGA_POINTS_PER_AURA_STEP));
    if (nextAura > state.yogaAura) {
      state.yogaAura = nextAura;
      auraChanged = true;
    }
    applyAuraToAvatar(avatarState, state.yogaAura, now);
  }

  return {
    ok: true,
    gained,
    yogaPoints: state.yogaPoints,
    yogaAura: state.yogaAura,
    auraChanged,
    previousAura: prevAura,
    viaStream: center.kind === "yoga_stream",
    consentUsed: state.consent.yogaAffectsAvatar,
    message: state.consent.yogaAffectsAvatar
      ? auraChanged
        ? `Yoga session done. Yoga aura → ${state.yogaAura}.`
        : `Yoga logged (+${gained} pts). Aura grows with regular practice.`
      : `Yoga logged. Enable yoga→avatar consent to show yoga aura on your avatar.`
  };
}

/** Decay / recompute appearance from stored points if consent on (e.g. after load). */
export function syncAvatarFromWellness(state, avatarState, now = Date.now()) {
  if (!avatarState) return { ok: false };
  if (state.consent.fitnessAffectsAvatar) {
    const idx = Math.min(
      BODY_PROGRESS.length - 1,
      Math.floor(state.gymPoints / GYM_POINTS_PER_BODY_STEP)
    );
    state.bodyStage = BODY_PROGRESS[idx];
    applyBodyToAvatar(avatarState, state.bodyStage, now);
  }
  if (state.consent.yogaAffectsAvatar) {
    state.yogaAura = Math.min(5, Math.floor(state.yogaPoints / YOGA_POINTS_PER_AURA_STEP));
    applyAuraToAvatar(avatarState, state.yogaAura, now);
  }
  return {
    ok: true,
    bodyStage: state.bodyStage,
    yogaAura: state.yogaAura
  };
}

export function visitStats(state, { days = 30, now = Date.now() } = {}) {
  const since = now - days * 86400_000;
  const recent = state.visits.filter((v) => v.at >= since);
  const gym = recent.filter((v) => v.kind === "gym").length;
  const yoga = recent.filter((v) => v.kind === "yoga" || v.kind === "yoga_stream").length;
  return { days, gymVisits: gym, yogaVisits: yoga, total: recent.length };
}

// —— Doctor booking ——

export const SAMPLE_DOCTORS = Object.freeze([
  { id: "doc-gp-1", name: "Dr. Ivanova", specialty: "gp", clinic: "City Clinic" },
  { id: "doc-sport-1", name: "Dr. Petrov", specialty: "sports_medicine", clinic: "Sports Med" },
  { id: "doc-physio-1", name: "Dr. Kim", specialty: "physiotherapy", clinic: "Rehab Center" },
  { id: "doc-nutri-1", name: "Dr. Ortega", specialty: "nutrition", clinic: "Wellness Hub" }
]);

export function listDoctors({ specialty } = {}) {
  let list = SAMPLE_DOCTORS.map((d) => ({ ...d }));
  if (specialty) list = list.filter((d) => d.specialty === specialty);
  return list;
}

export function bookDoctor(state, {
  doctorId,
  slotAt,
  reason = "",
  patientName = "Patient"
} = {}) {
  if (!state.consent.healthBooking) {
    return { ok: false, reason: "consent_required" };
  }
  const doc = SAMPLE_DOCTORS.find((d) => d.id === doctorId);
  if (!doc) return { ok: false, reason: "unknown_doctor" };
  const at = Number(slotAt);
  if (!Number.isFinite(at) || at < Date.now() - 60_000) {
    return { ok: false, reason: "invalid_slot" };
  }
  const appt = {
    id: uid("appt"),
    doctorId: doc.id,
    doctorName: doc.name,
    specialty: doc.specialty,
    clinic: doc.clinic,
    slotAt: at,
    reason: String(reason).slice(0, 200),
    patientName: String(patientName).slice(0, 40),
    status: "booked",
    createdAt: Date.now()
  };
  state.appointments.push(appt);
  return { ok: true, appointment: appt };
}

export function cancelAppointment(state, appointmentId) {
  const a = state.appointments.find((x) => x.id === appointmentId);
  if (!a) return { ok: false, reason: "not_found" };
  if (a.status === "completed") return { ok: false, reason: "already_completed" };
  a.status = "cancelled";
  return { ok: true, appointment: a };
}

export function listAppointments(state, { status } = {}) {
  let list = state.appointments.map((a) => ({ ...a }));
  if (status) list = list.filter((a) => a.status === status);
  return list.sort((a, b) => a.slotAt - b.slotAt);
}

export function summarizeWellness(state) {
  const c = state.consent;
  return [
    `gym ${state.gymPoints}pts/${state.bodyStage}`,
    `yoga ${state.yogaPoints}pts/aura ${state.yogaAura}`,
    c.fitnessAffectsAvatar || c.yogaAffectsAvatar ? "consent:on" : "consent:off",
    `${state.appointments.filter((a) => a.status === "booked").length} appt`
  ].join(" · ");
}
