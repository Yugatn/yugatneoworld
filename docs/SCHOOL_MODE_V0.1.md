# School mode v0.1

**Not a separate application.** School mode is a focused view inside the same Yugatn eWorld (same `world.schedule`, `world.classes`, same account).

## Why

Parents, teachers and students need a calm entry: schedule, classes, homework, presentations — without leaving the social apartment world or installing a second product.

## State

`world.schoolMode` (`src/domain/school-mode.js`):

| Field | Meaning |
|-------|---------|
| `mode` | `home` \| `school` |
| `role` | `student` \| `teacher` \| `parent` \| `admin` |
| `school` | optional org `{ id, name, nameRu, gradeLabel }` |
| `focusClassId` | optional class filter |
| `enteredAt` | when school mode was entered |

## API

- `enterSchoolMode(state, { role, schoolName, schoolNameRu, gradeLabel })`
- `exitSchoolMode(state)` → back to home mode
- `schoolDashboard(schoolState, scheduleState, classesState, now)` — today events, due reminders, homework, classes, presentations, capabilities
- `parseModeFromQuery("?mode=school")` — deep link / PWA shortcut

Shared data still lives in:

- `src/domain/schedule.js` — lessons, training, homework
- `src/domain/classes.js` — classes, product presentations

## Voice (ru/en)

- режим школы / school mode → `school.enter`
- выйти из школы / exit school / домой из школы → `school.exit`
- Existing: расписание, создать класс, презентация

## Entry points (product)

1. Voice or menu **School mode**
2. Kids room calendar / study board (same capabilities)
3. URL `?mode=school` for a bookmarkable “school only” feel without a second app

## Not in v0.1

- Separate store listing / native school app
- Server-side school directory and SSO
- Grades ledger, attendance, LMS file storage
- Multiplayer virtual classroom rooms
