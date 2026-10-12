import assert from "node:assert/strict";
import {
  createSchoolModeState,
  enterSchoolMode,
  exitSchoolMode,
  isSchoolMode,
  setSchoolRole,
  schoolDashboard,
  summarizeSchoolMode,
  parseModeFromQuery,
  APP_MODES,
  SCHOOL_CAPABILITIES
} from "../src/domain/school-mode.js";
import { createScheduleState, addLessonReminder, addEvent } from "../src/domain/schedule.js";
import { createClassesState, createClass, enrollStudent } from "../src/domain/classes.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 10);
const world = createDefaultWorld();
assert.ok(world.schoolMode);
assert.equal(world.schoolMode.mode, APP_MODES.HOME);

const sm = createSchoolModeState();
assert.equal(isSchoolMode(sm), false);
enterSchoolMode(sm, { role: "teacher", schoolName: "School 42", schoolNameRu: "Школа 42", gradeLabel: "5A" });
assert.equal(isSchoolMode(sm), true);
assert.equal(sm.role, "teacher");
assert.equal(sm.school.name, "School 42");
assert.ok(summarizeSchoolMode(sm).includes("School"));

setSchoolRole(sm, "student");
assert.equal(sm.role, "student");
assert.equal(setSchoolRole(sm, "wizard"), false);

const now = Date.now();
const sched = createScheduleState();
addLessonReminder(sched, { title: "Math", forName: "Masha", startAt: now + 3600_000 });
addEvent(sched, { title: "HW essay", kind: "homework", startAt: now + 7200_000, forName: "Masha" });
const cs = createClassesState();
const cls = createClass(cs, { title: "5A Math", subject: "math", teacherName: "Anna" });
enrollStudent(cs, cls.id, { studentId: "s1", studentName: "Masha" });

const dash = schoolDashboard(sm, sched, cs, now);
assert.equal(dash.mode, APP_MODES.SCHOOL);
assert.ok(dash.today.length >= 1);
assert.ok(dash.classes.length === 1);
assert.ok(dash.homework.length >= 1);
assert.ok(dash.capabilities.length === SCHOOL_CAPABILITIES.length);
assert.ok(dash.summary.todayCount >= 1);

exitSchoolMode(sm);
assert.equal(isSchoolMode(sm), false);
assert.equal(summarizeSchoolMode(sm), "Home mode");

assert.equal(parseModeFromQuery("?mode=school"), APP_MODES.SCHOOL);
assert.equal(parseModeFromQuery("mode=школа"), APP_MODES.SCHOOL);
assert.equal(parseModeFromQuery(""), APP_MODES.HOME);

assert.equal(matchVoiceCommand("режим школы").id, "school.enter");
assert.equal(matchVoiceCommand("school mode").id, "school.enter");
assert.equal(matchVoiceCommand("выйти из школы").id, "school.exit");
assert.equal(matchVoiceCommand("домой из школы").id, "school.exit");

console.log("school-mode tests OK");
