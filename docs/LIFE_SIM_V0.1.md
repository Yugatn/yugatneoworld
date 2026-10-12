# Life sim v0.1 — schedule, classes, presentations

Social network as a navigable home (Sims-like), not only chat profiles.

## Schedule & reminders

`world.schedule` (`src/domain/schedule.js`):

| Kind | Use |
|------|-----|
| lesson | school / tutoring |
| training | sports practice |
| homework | homework block |
| presentation | product or class pitch |
| class | class block |
| other | free-form |

- `addLessonReminder` / `addTrainingReminder` — for a child name (`forName`)
- `dueReminders(now)` — items whose `remindAt` has passed
- `acknowledgeReminder` — mark shown

**Where:** kids calendar in **Детская**, desk; also study laptop.

## Classes

`world.classes` (`src/domain/classes.js`):

- `createClass({ title, subject, teacherName })`
- `enrollStudent` / `unenrollStudent`
- `scheduleClassSession(scheduleState, class, { startAt })` → lesson event on the calendar

Subjects: math, language, science, art, sports, music, tech, other.

**Where:** study **presentation board** / laptop — `class.manage`.

## Product presentations

- `createPresentation({ title, productName, hostName, roomId })`
- `schedulePresentation` → optional calendar event
- `startPresentation` / `joinPresentation` / `endPresentation`
- Statuses: draft → scheduled → live → ended

**Where:** study board, living-room TV/laptop (`presentation.host` / `presentation.view`).

## Voice

- расписание / schedule
- создать класс / classes
- презентация / presentations

## Not in v0.1

- Push notifications / OS alarms
- Shared multiplayer class rooms on the server
- Slide assets / screen share
- Grades / attendance grades ledger
