/**
 * Voting & polls.
 * Civic / official polls require full identity verification (phone + passport + INN).
 * Community polls may allow any user.
 */

import { isFullyVerified } from "./identity-verify.js";

export const POLL_TYPES = Object.freeze(["community", "official", "school"]);
export const POLL_STATUSES = Object.freeze(["draft", "open", "closed"]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createVotingState(seed = {}) {
  return {
    polls: Array.isArray(seed.polls) ? seed.polls.map((p) => ({ ...p, options: p.options?.map((o) => ({ ...o })), votes: { ...(p.votes || {}) } })) : []
  };
}

export function createPoll(state, {
  title,
  description = "",
  options = [],
  type = "community",
  createdBy,
  requireFullVerification = null,
  endsAt = null
} = {}) {
  const t = String(title || "").trim().slice(0, 120);
  if (!t) return { ok: false, reason: "no_title" };
  const opts = (Array.isArray(options) ? options : [])
    .map((o, i) => ({
      id: typeof o === "object" && o.id ? String(o.id) : `opt_${i}`,
      label: String(typeof o === "object" ? o.label || o : o).slice(0, 80)
    }))
    .filter((o) => o.label);
  if (opts.length < 2) return { ok: false, reason: "need_two_options" };
  const pollType = POLL_TYPES.includes(type) ? type : "community";
  const requireFull =
    requireFullVerification != null
      ? Boolean(requireFullVerification)
      : pollType === "official";

  const poll = {
    id: uid("poll"),
    title: t,
    description: String(description).slice(0, 500),
    type: pollType,
    status: "open",
    options: opts,
    votes: {}, // userId → optionId
    createdBy: String(createdBy || "local"),
    createdAt: Date.now(),
    endsAt: endsAt ? Number(endsAt) : null,
    requireFullVerification: requireFull
  };
  state.polls.push(poll);
  return { ok: true, poll: { ...poll, options: poll.options.map((o) => ({ ...o })) } };
}

export function closePoll(state, pollId, actorId = null) {
  const poll = state.polls.find((p) => p.id === pollId);
  if (!poll) return { ok: false, reason: "not_found" };
  if (actorId && poll.createdBy !== String(actorId)) {
    return { ok: false, reason: "not_owner" };
  }
  poll.status = "closed";
  return { ok: true, poll: snapshotPoll(poll) };
}

function snapshotPoll(poll) {
  const counts = {};
  for (const opt of poll.options) counts[opt.id] = 0;
  for (const optId of Object.values(poll.votes)) {
    if (counts[optId] != null) counts[optId]++;
  }
  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    type: poll.type,
    status: poll.status,
    options: poll.options.map((o) => ({ ...o, votes: counts[o.id] || 0 })),
    totalVotes: Object.keys(poll.votes).length,
    requireFullVerification: poll.requireFullVerification,
    endsAt: poll.endsAt,
    createdBy: poll.createdBy
  };
}

export function castVote(state, identityState, {
  pollId,
  userId,
  optionId
} = {}) {
  const poll = state.polls.find((p) => p.id === pollId);
  if (!poll) return { ok: false, reason: "not_found" };
  if (poll.status !== "open") return { ok: false, reason: "not_open" };
  if (poll.endsAt && Date.now() > poll.endsAt) {
    poll.status = "closed";
    return { ok: false, reason: "ended" };
  }
  if (poll.requireFullVerification) {
    if (!identityState || !isFullyVerified(identityState, userId)) {
      return { ok: false, reason: "verification_required" };
    }
  }
  if (!poll.options.some((o) => o.id === optionId)) {
    return { ok: false, reason: "bad_option" };
  }
  const uid_ = String(userId);
  const previous = poll.votes[uid_] || null;
  poll.votes[uid_] = optionId;
  return {
    ok: true,
    changed: previous != null && previous !== optionId,
    previous,
    optionId,
    results: snapshotPoll(poll)
  };
}

export function getPollResults(state, pollId) {
  const poll = state.polls.find((p) => p.id === pollId);
  if (!poll) return null;
  return snapshotPoll(poll);
}

export function listPolls(state, { status, type } = {}) {
  let list = state.polls.map((p) => snapshotPoll(p));
  if (status) list = list.filter((p) => p.status === status);
  if (type) list = list.filter((p) => p.type === type);
  return list.sort((a, b) => (b.id > a.id ? 1 : -1));
}

export function summarizeVoting(state) {
  const open = state.polls.filter((p) => p.status === "open").length;
  return `${open} open poll(s) · ${state.polls.length} total`;
}
