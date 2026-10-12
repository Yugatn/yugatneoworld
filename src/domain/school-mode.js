/**
 * School mode — focused life-sim layer for schools inside the same eWorld.
 * Not a separate app: same world.schedule + world.classes; UI/presence focus only.
 * Teacher role: full schedule access (view + edit + assign lessons/homework).
 */

import {
  listEvents,
  dueReminders,
  summarizeSchedule,
  addEvent,
  removeEvent
} from "./schedule.js";
import {
  listClasses,
  listPresentations,
  summarizeClasses,
  getClass,
  scheduleClassSession
} from "./classes.js";

export const APP_MODES = Object.freeze({
  HOME: "home",
  SCHOOL: "school"
});

export const SCHOOL_ROLES = Object.freeze([
  "student",
  "teacher",
  "parent",
  "admin"
]);

/**
 * Capability ids. schedule.edit / schedule.assign are teacher (and admin) only.
 */
export const SCHOOL_CAPABILITIES = Object.freeze([
  { id: "schedule.view", label: "Today's schedule", labelRu: "Расписание на сегодня" },
  { id: "schedule.due", label: "Reminders", labelRu: "Напоминания" },
  { id: "schedule.edit", label: "Edit schedule", labelRu: "Редактировать расписание" },
  { id: "schedule.assign", label: "Assign lesson / homework", labelRu: "Назначить урок / ДЗ" },
  { id: "class.list", label: "My classes", labelRu: "Мои классы" },
  { id: "class.create", label: "Create class", labelRu: "Создать класс" },
  { id: "class.manage", label: "Manage class", labelRu: "Управление классом" },
  { id: "homework", label: "Homework", labelRu: "Домашние задания" },
  { id: "homework.assign", label: "Assign homework", labelRu: "Задать ДЗ" },
  { id: "presentation.list", label: "Presentations", labelRu: "Презентации" },
  { id: "presentation.host", label: "Host presentation", labelRu: "Провести презентацию" },
  { id: "school.exit", label: "Back to home", labelRu: "Домой" }
]);

/** Which capabilities each role may use. */
export const ROLE_PERMISSIONS = Object.freeze({
  student: Object.freeze([
    "schedule.view",
    "schedule.due",
    "class.list",
    "homework",
    "presentation.list",
    "school.exit"
  ]),
  parent: Object.freeze([
    "schedule.view",
    "schedule.due",
    "class.list",
    "homework",
    "presentation.list",
    "school.exit"
  ]),
  teacher: Object.freeze([
    "schedule.view",
    "schedule.due",
    "schedule.edit",
    "schedule.assign",
    "class.list",
    "class.create",
    "class.manage",
    "homework",
    "homework.assign",
    "presentation.list",
    "presentation.host",
    "school.exit"
  ]),
  admin: Object.freeze(SCHOOL_CAPABILITIES.map((c) => c.id))
});

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createSchoolModeState(seed = {}) {
  const mode = seed.mode === APP_MODES.SCHOOL ? APP_MODES.SCHOOL : APP_MODES.HOME;
  const role = SCHOOL_ROLES.includes(seed.role) ? seed.role : null;
  return {
    mode,
    role,
    /** Optional linked subject id for teacher filtering */
    teacherId: seed.teacherId ? String(seed.teacherId).slice(0, 64) : null,
    school: seed.school
      ? {
          id: seed.school.id || uid("sch"),
          name: String(seed.school.name || "School").slice(0, 80),
          nameRu: seed.school.nameRu ? String(seed.school.nameRu).slice(0, 80) : null,
          gradeLabel: seed.school.gradeLabel ? String(seed.school.gradeLabel).slice(0, 40) : null
        }
      : null,
    focusClassId: seed.focusClassId || null,
    enteredAt: typeof seed.enteredAt === "number" ? seed.enteredAt : 0
  };
}

export function isSchoolMode(state) {
  return state?.mode === APP_MODES.SCHOOL;
}

export function isTeacher(state) {
  return state?.role === "teacher" || state?.role === "admin";
}

/** True if role may use capability id. */
export function roleCan(role, capabilityId) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.student;
  return perms.includes(capabilityId);
}

export function canAccessSchedule(schoolState, { edit = false } = {}) {
  if (!schoolState) return false;
  const role = schoolState.role || "student";
  if (edit) return roleCan(role, "schedule.edit") || roleCan(role, "schedule.assign");
  return roleCan(role, "schedule.view");
}

export function capabilitiesForRole(role) {
  const ids = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.student;
  return SCHOOL_CAPABILITIES.filter((c) => ids.includes(c.id)).map((c) => ({ ...c }));
}

export function enterSchoolMode(
  state,
  { role = "student", schoolName = null, schoolNameRu = null, gradeLabel = null, teacherId = null } = {}
) {
  state.mode = APP_MODES.SCHOOL;
  state.role = SCHOOL_ROLES.includes(role) ? role : "student";
  state.enteredAt = Date.now();
  if (teacherId) state.teacherId = String(teacherId).slice(0, 64);
  else if (state.role === "teacher" && !state.teacherId) state.teacherId = state.teacherId || null;
  if (schoolName || !state.school) {
    state.school = {
      id: state.school?.id || uid("sch"),
      name: String(schoolName || state.school?.name || "My School").slice(0, 80),
      nameRu: schoolNameRu
        ? String(schoolNameRu).slice(0, 80)
        : state.school?.nameRu || null,
      gradeLabel: gradeLabel
        ? String(gradeLabel).slice(0, 40)
        : state.school?.gradeLabel || null
    };
  }
  return state;
}

/** Enter as teacher with schedule access. */
export function enterAsTeacher(state, opts = {}) {
  return enterSchoolMode(state, { ...opts, role: "teacher" });
}

export function exitSchoolMode(state) {
  state.mode = APP_MODES.HOME;
  state.enteredAt = 0;
  return state;
}

export function setSchoolRole(state, role) {
  if (!SCHOOL_ROLES.includes(role)) return false;
  state.role = role;
  return true;
}

export function setFocusClass(state, classId) {
  state.focusClassId = classId ? String(classId) : null;
  return state.focusClassId;
}

/**
 * Teacher schedule: all events for classes they teach, or full schedule if no teacherId.
 */
export function listTeacherSchedule(scheduleState, classesState, schoolState, { from, to } = {}) {
  if (!canAccessSchedule(schoolState)) return [];
  let events = listEvents(scheduleState, { from, to });
  const teacherId = schoolState.teacherId;
  if (teacherId && isTeacher(schoolState)) {
    const myClassIds = new Set(
      listClasses(classesState, { teacherId }).map((c) => c.id)
    );
    // Include: events for my classes, or authored by me (createdBy), or forName matches teacher
    events = events.filter((e) => {
      if (e.classId && myClassIds.has(e.classId)) return true;
      if (e.createdBy && e.createdBy === teacherId) return true;
      if (e.teacherId && e.teacherId === teacherId) return true;
      // If teacher has no classes yet, still show events they created later via assign*
      return false;
    });
    // If filter emptied everything but teacher has edit rights, show all school lessons
    // only when teacher has zero classes linked — keep filtered view otherwise.
    if (myClassIds.size === 0 && events.length === 0) {
      events = listEvents(scheduleState, { from, to }).filter((e) =>
        ["lesson", "homework", "class", "training", "presentation"].includes(e.kind)
      );
    }
  }
  return events;
}

/**
 * Teacher assigns a lesson onto the shared schedule (requires schedule.assign).
 */
export function teacherAssignLesson(schoolState, scheduleState, classesState, {
  classId = null,
  title,
  startAt,
  durationMin = 45,
  remindBeforeMin = 15,
  notes = ""
} = {}) {
  if (!canAccessSchedule(schoolState, { edit: true })) {
    return { ok: false, reason: "forbidden" };
  }
  let cls = null;
  if (classId) {
    cls = getClass(classesState, classId);
    if (!cls) return { ok: false, reason: "class_not_found" };
    if (schoolState.teacherId && cls.teacherId && cls.teacherId !== schoolState.teacherId) {
      return { ok: false, reason: "not_your_class" };
    }
  }
  if (cls) {
    const evt = scheduleClassSession(scheduleState, cls, { startAt, durationMin, remindBeforeMin });
    if (!evt) return { ok: false, reason: "invalid_event" };
    evt.createdBy = schoolState.teacherId || null;
    evt.teacherId = schoolState.teacherId || cls.teacherId || null;
    if (notes) evt.notes = String(notes).slice(0, 200);
    return { ok: true, event: evt };
  }
  const evt = addEvent(scheduleState, {
    title: title || "Lesson",
    kind: "lesson",
    startAt,
    durationMin,
    remindBeforeMin,
    forName: schoolState.school?.gradeLabel || null,
    notes: notes || "Assigned by teacher",
    classId: null
  });
  if (!evt) return { ok: false, reason: "invalid_event" };
  evt.createdBy = schoolState.teacherId || null;
  evt.teacherId = schoolState.teacherId || null;
  return { ok: true, event: evt };
}

/** Teacher assigns homework (schedule.assign + homework.assign). */
export function teacherAssignHomework(schoolState, scheduleState, {
  title,
  forName = null,
  classId = null,
  startAt,
  durationMin = 60,
  remindBeforeMin = 60,
  notes = ""
} = {}) {
  if (!roleCan(schoolState?.role, "homework.assign") && !roleCan(schoolState?.role, "schedule.assign")) {
    return { ok: false, reason: "forbidden" };
  }
  const evt = addEvent(scheduleState, {
    title: title || "Homework",
    kind: "homework",
    startAt,
    durationMin,
    remindBeforeMin,
    forName,
    classId,
    notes: notes || "Homework from teacher"
  });
  if (!evt) return { ok: false, reason: "invalid_event" };
  evt.createdBy = schoolState.teacherId || null;
  evt.teacherId = schoolState.teacherId || null;
  return { ok: true, event: evt };
}

/** Teacher removes an event they own or any if admin. */
export function teacherRemoveEvent(schoolState, scheduleState, eventId) {
  if (!canAccessSchedule(schoolState, { edit: true })) {
    return { ok: false, reason: "forbidden" };
  }
  const evt = scheduleState.events.find((e) => e.id === eventId);
  if (!evt) return { ok: false, reason: "not_found" };
  if (
    schoolState.role !== "admin" &&
    schoolState.teacherId &&
    evt.createdBy &&
    evt.createdBy !== schoolState.teacherId &&
    evt.teacherId &&
    evt.teacherId !== schoolState.teacherId
  ) {
    return { ok: false, reason: "not_yours" };
  }
  const removed = removeEvent(scheduleState, eventId);
  return { ok: removed, reason: removed ? null : "not_found" };
}

/** Panel snapshot; capabilities filtered by role. Teachers get full schedule tools. */
export function schoolDashboard(schoolState, scheduleState, classesState, now = Date.now()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = dayStart.getTime() + 24 * 3600_000;
  const role = schoolState.role || "student";

  let today;
  if (isTeacher(schoolState) && schoolState.teacherId) {
    today = listTeacherSchedule(scheduleState, classesState, schoolState, {
      from: dayStart.getTime(),
      to: dayEnd
    }).filter((e) => ["lesson", "training", "homework", "class", "presentation"].includes(e.kind));
  } else {
    today = listEvents(scheduleState, { from: dayStart.getTime(), to: dayEnd }).filter((e) =>
      ["lesson", "training", "homework", "class", "presentation"].includes(e.kind)
    );
  }

  const due = canAccessSchedule(schoolState) ? dueReminders(scheduleState, now) : [];
  const homework = canAccessSchedule(schoolState)
    ? listEvents(scheduleState, { kind: "homework" }).filter((e) => e.startAt >= now - 7 * 86400_000)
    : [];

  let classes = listClasses(classesState);
  if (isTeacher(schoolState) && schoolState.teacherId) {
    classes = listClasses(classesState, { teacherId: schoolState.teacherId });
    if (classes.length === 0) classes = listClasses(classesState);
  }

  const presentations = listPresentations(classesState).filter(
    (p) => p.status === "live" || p.status === "scheduled" || p.status === "draft"
  );

  return {
    mode: schoolState.mode,
    role,
    isTeacher: isTeacher(schoolState),
    canEditSchedule: canAccessSchedule(schoolState, { edit: true }),
    canViewSchedule: canAccessSchedule(schoolState),
    school: schoolState.school ? { ...schoolState.school } : null,
    focusClassId: schoolState.focusClassId,
    teacherId: schoolState.teacherId || null,
    today,
    due,
    homework,
    classes,
    presentations,
    capabilities: capabilitiesForRole(role),
    summary: {
      schedule: canAccessSchedule(schoolState) ? summarizeSchedule(scheduleState, now) : "No access",
      classes: summarizeClasses(classesState),
      todayCount: today.length,
      dueCount: due.length
    }
  };
}

export function summarizeSchoolMode(state) {
  if (!isSchoolMode(state)) return "Home mode";
  const name = state.school?.nameRu || state.school?.name || "School";
  const role = state.role || "student";
  return `School mode · ${name} · ${role}`;
}

export function parseModeFromQuery(search = "") {
  try {
    const q = new URLSearchParams(typeof search === "string" ? search.replace(/^\?/, "") : "");
    const m = (q.get("mode") || "").toLowerCase();
    if (m === "school" || m === "школа") return APP_MODES.SCHOOL;
    if (m === "teacher" || m === "учитель") return APP_MODES.SCHOOL;
    return APP_MODES.HOME;
  } catch {
    return APP_MODES.HOME;
  }
}

export function parseRoleFromQuery(search = "") {
  try {
    const q = new URLSearchParams(typeof search === "string" ? search.replace(/^\?/, "") : "");
    const r = (q.get("role") || "").toLowerCase();
    if (r === "teacher" || r === "учитель") return "teacher";
    if (r === "parent" || r === "родитель") return "parent";
    if (r === "admin") return "admin";
    if (r === "student" || r === "ученик") return "student";
    if ((q.get("mode") || "").toLowerCase() === "teacher") return "teacher";
    return null;
  } catch {
    return null;
  }
}
