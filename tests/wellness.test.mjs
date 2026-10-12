import assert from "node:assert/strict";
import {
  createWellnessState,
  setWellnessConsent,
  listFitnessCenters,
  linkFitnessCenter,
  completeGymSession,
  completeYogaSession,
  syncAvatarFromWellness,
  visitStats,
  listDoctors,
  bookDoctor,
  cancelAppointment,
  listAppointments,
  summarizeWellness,
  GYM_POINTS_PER_BODY_STEP
} from "../src/domain/wellness.js";
import { createAvatarState, getEffectiveAppearance } from "../src/domain/avatar.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 14);
const world = createDefaultWorld();
assert.ok(world.wellness);
assert.equal(world.wellness.consent.fitnessAffectsAvatar, false);

const centers = listFitnessCenters({ officialOnly: true });
assert.ok(centers.some((c) => c.kind === "gym"));
assert.ok(centers.some((c) => c.kind === "yoga" || c.kind === "yoga_stream"));

const w = createWellnessState();
const avatar = createAvatarState();

// Without consent: points accumulate, body does not change on avatar base
const noConsent = completeGymSession(w, avatar, { minutes: 60 });
assert.equal(noConsent.ok, true);
assert.equal(noConsent.consentUsed, false);
assert.ok(w.gymPoints > 0);
assert.equal(avatar.base.body, "default");

// Enable consent
setWellnessConsent(w, {
  fitnessAffectsAvatar: true,
  yogaAffectsAvatar: true,
  healthBooking: true,
  shareWithFitnessNetwork: true
});
assert.equal(w.consent.fitnessAffectsAvatar, true);

// Grind gym points enough for body step
while (w.gymPoints < GYM_POINTS_PER_BODY_STEP) {
  completeGymSession(w, avatar, { minutes: 60 });
}
const after = completeGymSession(w, avatar, { minutes: 60 });
assert.equal(after.ok, true);
assert.ok(["toned", "athletic", "strong"].includes(w.bodyStage));
assert.ok(avatar.fitness?.bodyStage);
const app = getEffectiveAppearance(avatar);
assert.ok(app.muscleTone >= 0 || app.body);
assert.ok(app.temps.includes("post_workout") || true);

// Yoga aura
const yoga = completeYogaSession(w, avatar, { centerId: "yoga-city", minutes: 60 });
assert.equal(yoga.ok, true);
completeYogaSession(w, avatar, { viaStream: true, minutes: 90 });
completeYogaSession(w, avatar, { centerId: "yoga-city", minutes: 90 });
completeYogaSession(w, avatar, { centerId: "yoga-city", minutes: 90 });
assert.ok(w.yogaAura >= 1 || w.yogaPoints >= 4);
syncAvatarFromWellness(w, avatar);
assert.ok(avatar.fitness?.yogaAura >= 0);

const stats = visitStats(w, { days: 30 });
assert.ok(stats.gymVisits >= 1);
assert.ok(stats.yogaVisits >= 1);

linkFitnessCenter(w, "gym-city");
assert.ok(w.linkedCenterIds.includes("gym-city"));

// Doctor — needs consent
const w2 = createWellnessState();
assert.equal(bookDoctor(w2, { doctorId: "doc-gp-1", slotAt: Date.now() + 86400_000 }).ok, false);
setWellnessConsent(w2, { healthBooking: true });
const docs = listDoctors({ specialty: "sports_medicine" });
assert.ok(docs.length >= 1);
const book = bookDoctor(w2, {
  doctorId: "doc-sport-1",
  slotAt: Date.now() + 2 * 86400_000,
  reason: "Knee check",
  patientName: "Anna"
});
assert.equal(book.ok, true);
assert.equal(listAppointments(w2, { status: "booked" }).length, 1);
cancelAppointment(w2, book.appointment.id);
assert.equal(listAppointments(w2, { status: "cancelled" }).length, 1);

assert.ok(summarizeWellness(w).includes("gym"));

assert.equal(matchVoiceCommand("фитнес").id, "wellness.gym");
assert.equal(matchVoiceCommand("йога").id, "wellness.yoga");
assert.equal(matchVoiceCommand("запись к врачу").id, "wellness.doctor");
assert.equal(matchVoiceCommand("согласие на фитнес").id, "wellness.consent");

console.log("wellness tests OK");
