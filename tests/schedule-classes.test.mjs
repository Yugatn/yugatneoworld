import assert from "node:assert/strict";
import {
  createScheduleState,
  addLessonReminder,
  addTrainingReminder,
  dueReminders,
  acknowledgeReminder,
  listEvents,
  summarizeSchedule
} from "../src/domain/schedule.js";
import {
  createClassesState,
  createClass,
  enrollStudent,
  scheduleClassSession,
  createPresentation,
  schedulePresentation,
  startPresentation,
  joinPresentation,
  endPresentation,
  listClasses,
  summarizeClasses
} from "../src/domain/classes.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";
import { matchVoiceCommand } from "../src/domain/voice-commands.js";

assert.ok(WORLD_VERSION >= 9);
const world = createDefaultWorld();
assert.ok(world.schedule);
assert.ok(world.classes);
assert.ok(world.objects.some((o) => o.id === "kids-calendar"));
assert.ok(world.objects.some((o) => o.id === "presentation-board"));

const now = Date.now();
const sched = createScheduleState();
const lesson = addLessonReminder(sched, {
  title: "Math",
  forName: "Masha",
  startAt: now + 20 * 60_000,
  remindBeforeMin: 30
});
assert.ok(lesson);
assert.equal(lesson.kind, "lesson");
const train = addTrainingReminder(sched, {
  title: "Football",
  forName: "Masha",
  startAt: now + 60 * 60_000
});
assert.equal(train.kind, "training");

// remindAt is in the past relative to now+ for lesson (start in 20m, remind 30m before => already due)
const due = dueReminders(sched, now);
assert.ok(due.some((d) => d.eventId === lesson.id));
acknowledgeReminder(sched, lesson.id);
assert.equal(dueReminders(sched, now).some((d) => d.eventId === lesson.id), false);
assert.ok(listEvents(sched).length >= 2);
assert.ok(summarizeSchedule(sched, now).length > 5);

const cs = createClassesState();
const cls = createClass(cs, { title: "Grade 5 Math", subject: "math", teacherName: "Anna" });
assert.ok(cls);
enrollStudent(cs, cls.id, { studentId: "s1", studentName: "Masha" });
enrollStudent(cs, cls.id, { studentId: "s2", studentName: "Ivan" });
assert.equal(cls.studentIds.length, 2);
const session = scheduleClassSession(sched, cls, { startAt: now + 2 * 3600_000 });
assert.ok(session);
assert.equal(session.classId, cls.id);
assert.ok(listClasses(cs).length === 1);

const pres = createPresentation(cs, {
  title: "Launch",
  productName: "Yugatn Box",
  hostName: "Host",
  roomId: "study"
});
assert.equal(pres.status, "draft");
schedulePresentation(cs, pres.id, now + 3600_000, sched);
assert.equal(pres.status, "scheduled");
startPresentation(cs, pres.id);
assert.equal(pres.status, "live");
joinPresentation(cs, pres.id, "guest1");
assert.ok(pres.attendeeIds.includes("guest1"));
endPresentation(cs, pres.id);
assert.equal(pres.status, "ended");
assert.ok(summarizeClasses(cs).includes("class"));

assert.equal(matchVoiceCommand("расписание").id, "schedule.view");
assert.equal(matchVoiceCommand("создать класс").id, "class.create");
assert.equal(matchVoiceCommand("презентация").id, "presentation.host");

console.log("schedule-classes tests OK");
