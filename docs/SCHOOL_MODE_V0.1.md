# School mode v0.1 (+ teacher role)

**Not a separate application.** School mode is a focused view inside the same Yugatn eWorld (same `world.schedule`, `world.classes`, same account).

## Roles & schedule access

| Role | schedule.view | schedule.edit / assign | class.create | homework.assign |
|------|---------------|------------------------|--------------|-----------------|
| student | yes | no | no | no |
| parent | yes | no | no | no |
| **teacher** | **yes** | **yes** | **yes** | **yes** |
| admin | yes | yes | yes | yes |

### Teacher API (`src/domain/school-mode.js`)

- `enterAsTeacher(state, { teacherId, schoolName, … })`
- `canAccessSchedule(state, { edit })`
- `listTeacherSchedule(schedule, classes, schoolState)` — events for teacher's classes
- `teacherAssignLesson(…)` — put a lesson on the shared calendar
- `teacherAssignHomework(…)` — homework event
- `teacherRemoveEvent(…)` — remove own (or any if admin)
- `schoolDashboard` → `isTeacher`, `canEditSchedule`, capabilities filtered by role

Deep links:

- `?mode=school` — school mode
- `?mode=teacher` or `?role=teacher` — school mode as teacher

Voice: «я учитель» / «роль учителя» / teacher mode → `school.teacher`.

## State

`world.schoolMode`:

| Field | Meaning |
|-------|---------|
| `mode` | `home` \| `school` |
| `role` | `student` \| `teacher` \| `parent` \| `admin` |
| `teacherId` | optional subject id for filtering classes/events |
| `school` | optional org `{ id, name, nameRu, gradeLabel }` |
| `focusClassId` | optional class filter |

## Not in v0.1

- Server-side verification of teacher credentials
- Grades ledger / attendance
- Multiplayer virtual classroom rooms
