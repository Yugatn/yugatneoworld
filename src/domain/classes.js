/**
 * Classes & product presentations — social learning / showcase layer.
 * Create a class, enroll students, host product pitches in the world.
 */

import { addEvent } from "./schedule.js";

export const CLASS_SUBJECTS = Object.freeze([
  "math", "language", "science", "art", "sports", "music", "tech", "other"
]);

export const PRESENTATION_STATUSES = Object.freeze([
  "draft", "scheduled", "live", "ended", "cancelled"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createClassesState(seed = {}) {
  return {
    classes: Array.isArray(seed.classes)
      ? seed.classes.map((c) => ({
          ...c,
          studentIds: c.studentIds ? [...c.studentIds] : [],
          studentNames: c.studentNames ? [...c.studentNames] : []
        }))
      : [],
    presentations: Array.isArray(seed.presentations)
      ? seed.presentations.map((p) => ({
          ...p,
          attendeeIds: p.attendeeIds ? [...p.attendeeIds] : []
        }))
      : []
  };
}

/**
 * Create a class (group of students + teacher).
 */
export function createClass(state, {
  title,
  subject = "other",
  teacherId = null,
  teacherName = "Teacher",
  description = "",
  maxStudents = 30
} = {}) {
  const t = String(title || "").trim().slice(0, 60);
  if (!t) return null;
  const sub = CLASS_SUBJECTS.includes(subject) ? subject : "other";
  const cls = {
    id: uid("cls"),
    title: t,
    subject: sub,
    teacherId: teacherId ? String(teacherId) : null,
    teacherName: String(teacherName).slice(0, 40),
    description: String(description).slice(0, 240),
    maxStudents: Math.max(1, Math.min(100, Number(maxStudents) || 30)),
    studentIds: [],
    studentNames: [],
    createdAt: Date.now()
  };
  state.classes.push(cls);
  return cls;
}

export function enrollStudent(state, classId, { studentId, studentName } = {}) {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls) return { ok: false, reason: "not_found" };
  const id = studentId ? String(studentId) : `local_${Date.now().toString(36)}`;
  const name = String(studentName || id).slice(0, 40);
  if (cls.studentIds.includes(id)) return { ok: true, already: true, class: cls };
  if (cls.studentIds.length >= cls.maxStudents) return { ok: false, reason: "full" };
  cls.studentIds.push(id);
  cls.studentNames.push(name);
  return { ok: true, class: cls };
}

export function unenrollStudent(state, classId, studentId) {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls) return false;
  const i = cls.studentIds.indexOf(studentId);
  if (i < 0) return false;
  cls.studentIds.splice(i, 1);
  cls.studentNames.splice(i, 1);
  return true;
}

export function getClass(state, classId) {
  return state.classes.find((c) => c.id === classId) || null;
}

export function listClasses(state, filter = {}) {
  let list = state.classes.map((c) => ({ ...c, studentIds: [...c.studentIds], studentNames: [...c.studentNames] }));
  if (filter.subject) list = list.filter((c) => c.subject === filter.subject);
  if (filter.teacherId) list = list.filter((c) => c.teacherId === filter.teacherId);
  return list;
}

/** Schedule a lesson for a class onto the shared schedule state. */
export function scheduleClassSession(scheduleState, cls, { startAt, durationMin = 45, remindBeforeMin = 15 } = {}) {
  if (!cls?.id || !Number.isFinite(Number(startAt))) return null;
  return addEvent(scheduleState, {
    title: cls.title,
    kind: "lesson",
    startAt: Number(startAt),
    durationMin,
    remindBeforeMin,
    classId: cls.id,
    forName: cls.teacherName,
    notes: `Class session · ${cls.subject} · ${cls.studentIds.length} students`,
    attendees: [...cls.studentIds]
  });
}

/**
 * Product presentation (pitch) — can be hosted in study / living room / street.
 */
export function createPresentation(state, {
  title,
  productName,
  hostId = null,
  hostName = "Host",
  description = "",
  startAt = null,
  roomId = "study"
} = {}) {
  const t = String(title || productName || "").trim().slice(0, 80);
  if (!t) return null;
  const pres = {
    id: uid("pres"),
    title: t,
    productName: String(productName || t).slice(0, 60),
    hostId: hostId ? String(hostId) : null,
    hostName: String(hostName).slice(0, 40),
    description: String(description).slice(0, 400),
    status: startAt ? "scheduled" : "draft",
    startAt: startAt != null ? Number(startAt) : null,
    roomId: String(roomId || "study"),
    attendeeIds: [],
    createdAt: Date.now()
  };
  state.presentations.push(pres);
  return pres;
}

export function schedulePresentation(state, presentationId, startAt, scheduleState = null) {
  const p = state.presentations.find((x) => x.id === presentationId);
  if (!p) return null;
  p.startAt = Number(startAt);
  p.status = "scheduled";
  if (scheduleState) {
    addEvent(scheduleState, {
      title: `Presentation: ${p.productName}`,
      kind: "presentation",
      startAt: p.startAt,
      durationMin: 30,
      remindBeforeMin: 15,
      forName: p.hostName,
      notes: p.title
    });
  }
  return p;
}

export function startPresentation(state, presentationId) {
  const p = state.presentations.find((x) => x.id === presentationId);
  if (!p) return null;
  if (p.status === "cancelled" || p.status === "ended") return null;
  p.status = "live";
  p.startedAt = Date.now();
  return p;
}

export function endPresentation(state, presentationId) {
  const p = state.presentations.find((x) => x.id === presentationId);
  if (!p) return null;
  p.status = "ended";
  p.endedAt = Date.now();
  return p;
}

export function joinPresentation(state, presentationId, attendeeId) {
  const p = state.presentations.find((x) => x.id === presentationId);
  if (!p || p.status === "cancelled" || p.status === "ended") return false;
  const id = String(attendeeId);
  if (!p.attendeeIds.includes(id)) p.attendeeIds.push(id);
  return true;
}

export function listPresentations(state, { status } = {}) {
  let list = state.presentations.map((p) => ({ ...p, attendeeIds: [...p.attendeeIds] }));
  if (status) list = list.filter((p) => p.status === status);
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function summarizeClasses(state) {
  const n = state.classes.length;
  const p = state.presentations.filter((x) => x.status === "live" || x.status === "scheduled").length;
  if (!n && !p) return "No classes or presentations";
  return `${n} class(es) · ${p} active presentation(s)`;
}
