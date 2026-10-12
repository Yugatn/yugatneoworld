import assert from "node:assert/strict";
import {
  createSchoolModeState,
  enterSchoolMode,
  enterAsTeacher,
  exitSchoolMode,
  isSchoolMode,
  isTeacher,
  setSchoolRole,
  schoolDashboard,
  summarizeSchoolMode,
  parseModeFromQuery,
  parseRoleFromQuery,
  canAccessSchedule,
  roleCan,
  capabilitiesForRole,
  teacherAssignLesson,
  teacherAssignHomework,
  teacherRemoveEvent,
  listTeacherSchedule,
  APP_MODES
} from "../src/domain/school-mode.js";
import { createScheduleState, addLessonReminder, addEvent } from "../src/domain/schedule.js";
import { createClassesState, createClass, enrollStudent } from "../src/domain/classes.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 10);
const world = createDefaultWorld();
assert.ok(world.schoolMode);
assert.equal(world.schoolMode.mode, APP_MODES.HOME);

// —— Student: view only ——
const student = createSchoolModeState();
enterSchoolMode(student, { role: "student", schoolName: "School 42" });
assert.equal(isTeacher(student), false);
assert.equal(canAccessSchedule(student), true);
assert.equal(canAccessSchedule(student, { edit: true }), false);
assert.equal(roleCan("student", "schedule.edit"), false);
assert.ok(capabilitiesForRole("student").every((c) => c.id !== "schedule.edit"));

// —— Teacher: full schedule access ——
const teacher = createSchoolModeState();
enterAsTeacher(teacher, {
  schoolName: "School 42",
  schoolNameRu: "Школа 42",
  gradeLabel: "5A",
  teacherId: "t_anna"
});
assert.equal(isSchoolMode(teacher), true);
assert.equal(isTeacher(teacher), true);
assert.equal(teacher.role, "teacher");
assert.equal(teacher.teacherId, "t_anna");
assert.equal(canAccessSchedule(teacher), true);
assert.equal(canAccessSchedule(teacher, { edit: true }), true);
assert.equal(roleCan("teacher", "schedule.view"), true);
assert.equal(roleCan("teacher", "schedule.edit"), true);
assert.equal(roleCan("teacher", "schedule.assign"), true);
assert.equal(roleCan("teacher", "homework.assign"), true);
assert.ok(capabilitiesForRole("teacher").some((c) => c.id === "schedule.edit"));
assert.ok(summarizeSchoolMode(teacher).includes("teacher"));

const now = Date.now();
const sched = createScheduleState();
const cs = createClassesState();
const cls = createClass(cs, {
  title: "5A Math",
  subject: "math",
  teacherName: "Anna",
  teacherId: "t_anna"
});
enrollStudent(cs, cls.id, { studentId: "s1", studentName: "Masha" });

// Teacher assigns lesson
const assigned = teacherAssignLesson(teacher, sched, cs, {
  classId: cls.id,
  startAt: now + 3600_000,
  durationMin: 45
});
assert.equal(assigned.ok, true);
assert.equal(assigned.event.kind, "lesson");
assert.equal(assigned.event.classId, cls.id);
assert.equal(assigned.event.createdBy, "t_anna");

// Student cannot assign
const denied = teacherAssignLesson(student, sched, cs, {
  classId: cls.id,
  startAt: now + 7200_000
});
assert.equal(denied.ok, false);
assert.equal(denied.reason, "forbidden");

// Homework by teacher
const hw = teacherAssignHomework(teacher, sched, {
  title: "Exercises p.12",
  forName: "Masha",
  classId: cls.id,
  startAt: now + 86400_000
});
assert.equal(hw.ok, true);
assert.equal(hw.event.kind, "homework");

const studentHw = teacherAssignHomework(student, sched, {
  title: "Hack",
  startAt: now + 90000
});
assert.equal(studentHw.ok, false);

// Teacher schedule list
const tSched = listTeacherSchedule(sched, cs, teacher, { from: now });
assert.ok(tSched.length >= 1);
assert.ok(tSched.some((e) => e.classId === cls.id));

// Dashboard flags
const dash = schoolDashboard(teacher, sched, cs, now);
assert.equal(dash.isTeacher, true);
assert.equal(dash.canEditSchedule, true);
assert.equal(dash.canViewSchedule, true);
assert.ok(dash.capabilities.some((c) => c.id === "schedule.assign"));
assert.ok(dash.today.length >= 1);

const dashStudent = schoolDashboard(student, sched, cs, now);
assert.equal(dashStudent.isTeacher, false);
assert.equal(dashStudent.canEditSchedule, false);
assert.ok(!dashStudent.capabilities.some((c) => c.id === "schedule.edit"));

// Remove own event
const rm = teacherRemoveEvent(teacher, sched, assigned.event.id);
assert.equal(rm.ok, true);

setSchoolRole(teacher, "student");
assert.equal(isTeacher(teacher), false);
assert.equal(setSchoolRole(teacher, "wizard"), false);

exitSchoolMode(teacher);
assert.equal(isSchoolMode(teacher), false);

assert.equal(parseModeFromQuery("?mode=school"), APP_MODES.SCHOOL);
assert.equal(parseModeFromQuery("?mode=teacher"), APP_MODES.SCHOOL);
assert.equal(parseRoleFromQuery("?role=teacher"), "teacher");
assert.equal(parseRoleFromQuery("?role=учитель"), "teacher");
assert.equal(parseRoleFromQuery("?mode=teacher"), "teacher");

assert.equal(matchVoiceCommand("режим школы").id, "school.enter");
assert.equal(matchVoiceCommand("я учитель").id, "school.teacher");
assert.equal(matchVoiceCommand("роль учителя").id, "school.teacher");
assert.equal(matchVoiceCommand("teacher mode").id, "school.teacher");
assert.equal(matchVoiceCommand("выйти из школы").id, "school.exit");

console.log("school-mode tests OK");
