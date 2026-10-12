/**
 * Schedule & reminders — lessons, training, chores for kids/students.
 * Pure domain (Sims-like life layer inside the social world).
 */

export const EVENT_KINDS = Object.freeze([
  "lesson",      // school / study class session
  "training",    // sports / practice
  "homework",
  "presentation", // product or class presentation
  "class",       // recurring class block
  "other"
]);

export const WEEKDAYS = Object.freeze([
  "mon", "tue", "wed", "thu", "fri", "sat", "sun"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createScheduleState(seed = {}) {
  return {
    events: Array.isArray(seed.events)
      ? seed.events.map((e) => ({ ...e, attendees: e.attendees ? [...e.attendees] : [] }))
      : [],
    /** Fired reminder ids already shown (avoid spam). */
    acknowledged: Array.isArray(seed.acknowledged) ? [...seed.acknowledged] : []
  };
}

/**
 * Add a scheduled item.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.kind] lesson|training|...
 * @param {number} opts.startAt — epoch ms
 * @param {number} [opts.durationMin]
 * @param {string} [opts.forName] — child / student label
 * @param {string} [opts.subjectId] — linked account if any
 * @param {number} [opts.remindBeforeMin] — minutes before start
 * @param {string[]} [opts.weekdays] — if set, weekly recurrence pattern (next occurrences computed by UI)
 * @param {string} [opts.notes]
 * @param {string} [opts.classId]
 */
export function addEvent(state, opts = {}) {
  const title = String(opts.title || "").trim().slice(0, 80);
  if (!title) return null;
  const kind = EVENT_KINDS.includes(opts.kind) ? opts.kind : "other";
  const startAt = Number(opts.startAt);
  if (!Number.isFinite(startAt)) return null;
  const durationMin = Math.max(5, Math.min(480, Number(opts.durationMin) || 45));
  const remindBeforeMin = Math.max(0, Math.min(24 * 60, Number(opts.remindBeforeMin) ?? 15));
  const event = {
    id: uid("evt"),
    title,
    kind,
    startAt,
    endAt: startAt + durationMin * 60_000,
    durationMin,
    forName: String(opts.forName || "").slice(0, 40) || null,
    subjectId: opts.subjectId ? String(opts.subjectId).slice(0, 64) : null,
    remindBeforeMin,
    remindAt: startAt - remindBeforeMin * 60_000,
    weekdays: Array.isArray(opts.weekdays)
      ? opts.weekdays.map(String).filter((d) => WEEKDAYS.includes(d))
      : [],
    notes: String(opts.notes || "").slice(0, 200),
    classId: opts.classId || null,
    attendees: Array.isArray(opts.attendees) ? opts.attendees.map(String).slice(0, 40) : [],
    createdAt: Date.now()
  };
  state.events.push(event);
  return event;
}

export function removeEvent(state, eventId) {
  const before = state.events.length;
  state.events = state.events.filter((e) => e.id !== eventId);
  state.acknowledged = state.acknowledged.filter((id) => id !== eventId);
  return before !== state.events.length;
}

export function listEvents(state, { from, to, kind, forName } = {}) {
  let list = state.events.map((e) => ({ ...e }));
  if (from != null) list = list.filter((e) => e.startAt >= from);
  if (to != null) list = list.filter((e) => e.startAt <= to);
  if (kind) list = list.filter((e) => e.kind === kind);
  if (forName) list = list.filter((e) => (e.forName || "").toLowerCase() === String(forName).toLowerCase());
  return list.sort((a, b) => a.startAt - b.startAt);
}

/** Reminders that should fire at `now` (remindAt <= now < startAt+grace) and not yet acknowledged. */
export function dueReminders(state, now = Date.now(), graceMs = 30 * 60_000) {
  return state.events
    .filter((e) => {
      if (state.acknowledged.includes(e.id)) return false;
      if (e.remindAt > now) return false;
      if (e.startAt + graceMs < now) return false;
      return true;
    })
    .map((e) => ({
      eventId: e.id,
      title: e.title,
      kind: e.kind,
      forName: e.forName,
      startAt: e.startAt,
      minutesUntil: Math.round((e.startAt - now) / 60_000),
      message: formatReminder(e, now)
    }));
}

export function acknowledgeReminder(state, eventId) {
  if (!state.acknowledged.includes(eventId)) state.acknowledged.push(eventId);
  return true;
}

export function formatReminder(event, now = Date.now()) {
  const mins = Math.round((event.startAt - now) / 60_000);
  const when = mins > 0 ? `in ${mins} min` : mins === 0 ? "now" : `${-mins} min ago`;
  const who = event.forName ? ` (${event.forName})` : "";
  const kind = event.kind !== "other" ? `[${event.kind}] ` : "";
  return `${kind}${event.title}${who} — ${when}`;
}

/** Quick helpers for common Sims-like schedules. */
export function addLessonReminder(state, { title, forName, startAt, durationMin = 45, remindBeforeMin = 20 } = {}) {
  return addEvent(state, {
    title: title || "Lesson",
    kind: "lesson",
    forName,
    startAt,
    durationMin,
    remindBeforeMin
  });
}

export function addTrainingReminder(state, { title, forName, startAt, durationMin = 60, remindBeforeMin = 30 } = {}) {
  return addEvent(state, {
    title: title || "Training",
    kind: "training",
    forName,
    startAt,
    durationMin,
    remindBeforeMin
  });
}

export function summarizeSchedule(state, now = Date.now()) {
  const upcoming = listEvents(state, { from: now }).slice(0, 5);
  const due = dueReminders(state, now);
  if (!upcoming.length && !due.length) return "Schedule empty";
  const parts = [];
  if (due.length) parts.push(`${due.length} reminder(s) due`);
  if (upcoming.length) {
    parts.push(
      "next: " +
        upcoming
          .map((e) => `${e.title}${e.forName ? "/" + e.forName : ""}`)
          .join(", ")
    );
  }
  return parts.join(" · ");
}
