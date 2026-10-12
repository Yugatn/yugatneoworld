/**
 * School mode — focused life-sim layer for schools inside the same eWorld.
 * Not a separate app: same world.schedule + world.classes; UI/presence focus only.
 */

import { listEvents, dueReminders, summarizeSchedule } from "./schedule.js";
import { listClasses, listPresentations, summarizeClasses } from "./classes.js";

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

/** Capabilities exposed while school mode is active (for panels / objects). */
export const SCHOOL_CAPABILITIES = Object.freeze([
  { id: "schedule.view", label: "Today's schedule", labelRu: "Расписание на сегодня" },
  { id: "schedule.due", label: "Reminders", labelRu: "Напоминания" },
  { id: "class.list", label: "My classes", labelRu: "Мои классы" },
  { id: "class.create", label: "Create class", labelRu: "Создать класс" },
  { id: "homework", label: "Homework", labelRu: "Домашние задания" },
  { id: "presentation.list", label: "Presentations", labelRu: "Презентации" },
  { id: "presentation.host", label: "Host presentation", labelRu: "Провести презентацию" },
  { id: "school.exit", label: "Back to home", labelRu: "Домой" }
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @typedef {object} SchoolModeState
 * @property {string} mode — home | school
 * @property {string|null} role — student | teacher | parent | admin
 * @property {object|null} school — optional org profile
 * @property {string|null} focusClassId
 * @property {number} enteredAt
 */

export function createSchoolModeState(seed = {}) {
  const mode = seed.mode === APP_MODES.SCHOOL ? APP_MODES.SCHOOL : APP_MODES.HOME;
  const role = SCHOOL_ROLES.includes(seed.role) ? seed.role : null;
  return {
    mode,
    role,
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

export function enterSchoolMode(state, { role = "student", schoolName = null, schoolNameRu = null, gradeLabel = null } = {}) {
  state.mode = APP_MODES.SCHOOL;
  state.role = SCHOOL_ROLES.includes(role) ? role : "student";
  state.enteredAt = Date.now();
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

/** Panel snapshot for school mode UI (uses shared schedule + classes). */
export function schoolDashboard(schoolState, scheduleState, classesState, now = Date.now()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = dayStart.getTime() + 24 * 3600_000;

  const today = listEvents(scheduleState, { from: dayStart.getTime(), to: dayEnd }).filter(
    (e) => ["lesson", "training", "homework", "class", "presentation"].includes(e.kind)
  );
  const due = dueReminders(scheduleState, now);
  const homework = listEvents(scheduleState, { kind: "homework" }).filter((e) => e.startAt >= now - 7 * 86400_000);
  const classes = listClasses(classesState);
  const presentations = listPresentations(classesState).filter(
    (p) => p.status === "live" || p.status === "scheduled" || p.status === "draft"
  );

  return {
    mode: schoolState.mode,
    role: schoolState.role,
    school: schoolState.school ? { ...schoolState.school } : null,
    focusClassId: schoolState.focusClassId,
    today,
    due,
    homework,
    classes,
    presentations,
    capabilities: SCHOOL_CAPABILITIES.map((c) => ({ ...c })),
    summary: {
      schedule: summarizeSchedule(scheduleState, now),
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

/** Deep-link style: ?mode=school */
export function parseModeFromQuery(search = "") {
  try {
    const q = new URLSearchParams(typeof search === "string" ? search.replace(/^\?/, "") : "");
    const m = (q.get("mode") || "").toLowerCase();
    if (m === "school" || m === "школа") return APP_MODES.SCHOOL;
    return APP_MODES.HOME;
  } catch {
    return APP_MODES.HOME;
  }
}
