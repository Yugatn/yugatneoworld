/**
 * Built-in logic games + tournaments for eWorld.
 * Chess / checkers / monopoly (simplified domain models) + tic-tac-toe / reversi.
 * Full FIDE engines are out of scope — moves are recorded with light validation.
 */

import { sanitizeText } from "./security.js";
import { credit, ensureWallet } from "./currency.js";

export const GAME_IDS = Object.freeze([
  "chess",
  "checkers",
  "monopoly",
  "tictactoe",
  "reversi"
]);

export const GAME_CATALOG = Object.freeze([
  {
    id: "chess",
    name: "Шахматы",
    nameEn: "Chess",
    players: 2,
    minPlayers: 2,
    maxPlayers: 2,
    board: "8x8",
    category: "board"
  },
  {
    id: "checkers",
    name: "Шашки",
    nameEn: "Checkers",
    players: 2,
    minPlayers: 2,
    maxPlayers: 2,
    board: "8x8",
    category: "board"
  },
  {
    id: "monopoly",
    name: "Монополия",
    nameEn: "Monopoly",
    players: 4,
    minPlayers: 2,
    maxPlayers: 6,
    board: "ring40",
    category: "economy"
  },
  {
    id: "tictactoe",
    name: "Крестики-нолики",
    nameEn: "Tic-tac-toe",
    players: 2,
    minPlayers: 2,
    maxPlayers: 2,
    board: "3x3",
    category: "logic"
  },
  {
    id: "reversi",
    name: "Реверси",
    nameEn: "Reversi",
    players: 2,
    minPlayers: 2,
    maxPlayers: 2,
    board: "8x8",
    category: "logic"
  }
]);

export const MATCH_STATUSES = Object.freeze([
  "waiting",
  "active",
  "finished",
  "aborted"
]);

export const TOURNAMENT_STATUSES = Object.freeze([
  "open",
  "running",
  "finished",
  "cancelled"
]);

export const DEFAULT_RATING = 1000;
export const TOURNAMENT_PRIZE_YC = 15;

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function gameOk(id) {
  return GAME_IDS.includes(id);
}

function catalogEntry(id) {
  return GAME_CATALOG.find((g) => g.id === id) || null;
}

export function createGamesState(seed = {}) {
  return {
    matches: Array.isArray(seed.matches) ? seed.matches.map((m) => ({ ...m, moves: [...(m.moves || [])], players: [...(m.players || [])] })) : [],
    tournaments: Array.isArray(seed.tournaments)
      ? seed.tournaments.map((t) => ({
          ...t,
          entrants: [...(t.entrants || [])],
          bracket: Array.isArray(t.bracket) ? t.bracket.map((b) => ({ ...b })) : []
        }))
      : [],
    /** userId → { chess, checkers, ... } ratings */
    ratings: seed.ratings && typeof seed.ratings === "object" ? { ...seed.ratings } : {}
  };
}

export function listGames() {
  return GAME_CATALOG.map((g) => ({ ...g }));
}

function ensureRating(state, userId, gameId) {
  const id = String(userId);
  if (!state.ratings[id]) state.ratings[id] = {};
  if (state.ratings[id][gameId] == null) state.ratings[id][gameId] = DEFAULT_RATING;
  return state.ratings[id][gameId];
}

export function getRating(state, userId, gameId) {
  return ensureRating(state, userId, gameId);
}

function adjustRating(state, winnerId, loserId, gameId) {
  const rw = ensureRating(state, winnerId, gameId);
  const rl = ensureRating(state, loserId, gameId);
  const k = 24;
  const expected = 1 / (1 + 10 ** ((rl - rw) / 400));
  const dw = Math.round(k * (1 - expected));
  const dl = Math.round(k * expected);
  state.ratings[String(winnerId)][gameId] = rw + dw;
  state.ratings[String(loserId)][gameId] = Math.max(100, rl - dl);
  return {
    winner: state.ratings[String(winnerId)][gameId],
    loser: state.ratings[String(loserId)][gameId]
  };
}

function initialBoard(gameId) {
  if (gameId === "tictactoe") {
    return { cells: Array(9).fill(null), next: "X" };
  }
  if (gameId === "chess" || gameId === "checkers" || gameId === "reversi") {
    return { fen: "start", note: "symbolic start position", ply: 0 };
  }
  if (gameId === "monopoly") {
    return {
      positions: {},
      cash: {},
      turnIndex: 0,
      round: 1
    };
  }
  return {};
}

export function createMatch(state, {
  gameId,
  hostId,
  rated = true,
  tournamentId = null
} = {}) {
  if (!gameOk(gameId)) return { ok: false, reason: "unknown_game" };
  const cat = catalogEntry(gameId);
  const host = String(hostId || "local");
  ensureRating(state, host, gameId);

  const match = {
    id: uid("gm"),
    gameId,
    hostId: host,
    players: [host],
    status: "waiting",
    rated: Boolean(rated),
    tournamentId: tournamentId || null,
    board: initialBoard(gameId),
    moves: [],
    winnerId: null,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    maxPlayers: cat.maxPlayers
  };
  state.matches.push(match);
  return { ok: true, match: { ...match, moves: [...match.moves], players: [...match.players] } };
}

export function joinMatch(state, matchId, userId) {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, reason: "not_found" };
  if (match.status !== "waiting") return { ok: false, reason: "not_waiting" };
  const uid_ = String(userId);
  if (match.players.includes(uid_)) return { ok: false, reason: "already_joined" };
  if (match.players.length >= match.maxPlayers) return { ok: false, reason: "full" };

  match.players.push(uid_);
  ensureRating(state, uid_, match.gameId);
  match.updatedAt = Date.now();

  const cat = catalogEntry(match.gameId);
  if (match.players.length >= cat.minPlayers) {
    match.status = "active";
    if (match.gameId === "monopoly") {
      for (const p of match.players) {
        match.board.positions[p] = 0;
        match.board.cash[p] = 1500;
      }
    }
  }
  return { ok: true, match: snapshotMatch(match) };
}

function snapshotMatch(match) {
  return {
    ...match,
    players: [...match.players],
    moves: match.moves.map((m) => ({ ...m })),
    board: match.board && typeof match.board === "object" ? JSON.parse(JSON.stringify(match.board)) : match.board
  };
}

/** Record a move. Light validation by game type. */
export function playMove(state, matchId, userId, move) {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, reason: "not_found" };
  if (match.status !== "active") return { ok: false, reason: "not_active" };
  const uid_ = String(userId);
  if (!match.players.includes(uid_)) return { ok: false, reason: "not_player" };

  const notation = sanitizeText(
    typeof move === "string" ? move : move?.notation || JSON.stringify(move),
    { maxLen: 80 }
  ).trim();
  if (!notation) return { ok: false, reason: "empty_move" };

  if (match.gameId === "tictactoe") {
    const cell = Number(typeof move === "object" ? move.cell : notation);
    if (!Number.isInteger(cell) || cell < 0 || cell > 8) {
      return { ok: false, reason: "bad_cell" };
    }
    if (match.board.cells[cell] != null) return { ok: false, reason: "occupied" };
    const mark = match.board.next;
    const expectedPlayer =
      mark === "X" ? match.players[0] : match.players[1] || match.players[0];
    if (uid_ !== expectedPlayer) return { ok: false, reason: "not_your_turn" };
    match.board.cells[cell] = mark;
    match.board.next = mark === "X" ? "O" : "X";
    match.moves.push({ at: Date.now(), by: uid_, notation: `${mark}@${cell}` });
    const win = tictactoeWinner(match.board.cells);
    if (win) {
      finishMatch(state, match, uid_, "win");
    } else if (match.board.cells.every((c) => c != null)) {
      finishMatch(state, match, null, "draw");
    }
    match.updatedAt = Date.now();
    return { ok: true, match: snapshotMatch(match) };
  }

  // chess / checkers / reversi / monopoly — append notation
  match.moves.push({ at: Date.now(), by: uid_, notation });
  if (match.board.ply != null) match.board.ply += 1;

  if (match.gameId === "monopoly" && typeof move === "object" && move.dice) {
    const dice = Math.min(12, Math.max(2, Number(move.dice) || 2 + Math.floor(Math.random() * 11)));
    const pos = (match.board.positions[uid_] || 0) + dice;
    match.board.positions[uid_] = pos % 40;
    match.board.turnIndex = (match.board.turnIndex + 1) % match.players.length;
  }

  // Explicit resign / claim win helpers
  if (/^resign$/i.test(notation)) {
    const other = match.players.find((p) => p !== uid_) || null;
    finishMatch(state, match, other, other ? "resign" : "abort");
  }
  if (/^claim[_-]?win$/i.test(notation) && match.players.length === 2) {
    finishMatch(state, match, uid_, "claim");
  }

  match.updatedAt = Date.now();
  return { ok: true, match: snapshotMatch(match) };
}

function tictactoeWinner(cells) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
  }
  return null;
}

function finishMatch(state, match, winnerId, result) {
  match.status = "finished";
  match.winnerId = winnerId;
  match.result = result;
  match.updatedAt = Date.now();
  if (match.rated && winnerId && match.players.length === 2) {
    const loser = match.players.find((p) => p !== winnerId);
    if (loser) adjustRating(state, winnerId, loser, match.gameId);
  }
  if (match.tournamentId) {
    advanceTournament(state, match.tournamentId, match);
  }
}

export function abortMatch(state, matchId, actorId) {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, reason: "not_found" };
  if (match.status === "finished") return { ok: false, reason: "already_finished" };
  if (match.hostId !== String(actorId) && !match.players.includes(String(actorId))) {
    return { ok: false, reason: "not_allowed" };
  }
  match.status = "aborted";
  match.updatedAt = Date.now();
  return { ok: true, match: snapshotMatch(match) };
}

export function listMatches(state, { gameId = null, status = null, limit = 30 } = {}) {
  let list = state.matches.slice();
  if (gameId) list = list.filter((m) => m.gameId === gameId);
  if (status) list = list.filter((m) => m.status === status);
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  return list.slice(0, limit).map(snapshotMatch);
}

export function getMatch(state, matchId) {
  const m = state.matches.find((x) => x.id === matchId);
  return m ? snapshotMatch(m) : null;
}

// —— Tournaments (single-elimination) ——

export function createTournament(state, {
  gameId,
  hostId,
  name = "",
  maxEntrants = 8,
  prizeYc = TOURNAMENT_PRIZE_YC
} = {}) {
  if (!gameOk(gameId)) return { ok: false, reason: "unknown_game" };
  const n = Math.min(32, Math.max(2, Number(maxEntrants) || 8));
  // power of 2 preferred
  let size = 2;
  while (size < n) size *= 2;
  if (size > 32) size = 32;

  const t = {
    id: uid("tn"),
    gameId,
    hostId: String(hostId || "local"),
    name: sanitizeText(name || `${catalogEntry(gameId).name} cup`, { maxLen: 60 }),
    maxEntrants: size,
    entrants: [],
    bracket: [],
    status: "open",
    prizeYc: Math.max(0, Math.round(Number(prizeYc) || 0)),
    winnerId: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.tournaments.push(t);
  return { ok: true, tournament: { ...t, entrants: [], bracket: [] } };
}

export function joinTournament(state, tournamentId, userId) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return { ok: false, reason: "not_found" };
  if (t.status !== "open") return { ok: false, reason: "not_open" };
  const uid_ = String(userId);
  if (t.entrants.includes(uid_)) return { ok: false, reason: "already_joined" };
  if (t.entrants.length >= t.maxEntrants) return { ok: false, reason: "full" };
  t.entrants.push(uid_);
  ensureRating(state, uid_, t.gameId);
  t.updatedAt = Date.now();
  return { ok: true, tournament: snapshotTournament(t) };
}

function snapshotTournament(t) {
  return {
    ...t,
    entrants: [...t.entrants],
    bracket: t.bracket.map((b) => ({ ...b }))
  };
}

export function startTournament(state, tournamentId, hostId) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return { ok: false, reason: "not_found" };
  if (t.hostId !== String(hostId)) return { ok: false, reason: "not_host" };
  if (t.status !== "open") return { ok: false, reason: "not_open" };
  if (t.entrants.length < 2) return { ok: false, reason: "need_2_players" };

  // pad with byes to power of 2
  const players = [...t.entrants];
  while (players.length & (players.length - 1)) players.push(null); // bye slots

  t.bracket = [];
  for (let i = 0; i < players.length; i += 2) {
    const a = players[i];
    const b = players[i + 1];
    if (a && !b) {
      t.bracket.push({
        id: uid("br"),
        round: 1,
        a,
        b: null,
        winnerId: a,
        matchId: null,
        bye: true
      });
    } else if (!a && b) {
      t.bracket.push({
        id: uid("br"),
        round: 1,
        a: b,
        b: null,
        winnerId: b,
        matchId: null,
        bye: true
      });
    } else {
      const m = createMatch(state, {
        gameId: t.gameId,
        hostId: a,
        rated: true,
        tournamentId: t.id
      });
      joinMatch(state, m.match.id, b);
      t.bracket.push({
        id: uid("br"),
        round: 1,
        a,
        b,
        winnerId: null,
        matchId: m.match.id,
        bye: false
      });
    }
  }
  t.status = "running";
  t.updatedAt = Date.now();
  // auto-advance pure byes
  tryAdvanceRounds(state, t);
  return { ok: true, tournament: snapshotTournament(t) };
}

function advanceTournament(state, tournamentId, finishedMatch) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t || t.status !== "running") return;
  const node = t.bracket.find((b) => b.matchId === finishedMatch.id);
  if (!node) return;
  node.winnerId = finishedMatch.winnerId;
  tryAdvanceRounds(state, t);
}

function tryAdvanceRounds(state, t) {
  const rounds = [...new Set(t.bracket.map((b) => b.round))].sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);
  const current = t.bracket.filter((b) => b.round === maxRound);
  if (!current.every((b) => b.winnerId)) return;

  const winners = current.map((b) => b.winnerId).filter(Boolean);
  if (winners.length === 1) {
    t.status = "finished";
    t.winnerId = winners[0];
    t.updatedAt = Date.now();
    return;
  }
  if (winners.length < 2) return;

  const nextRound = maxRound + 1;
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] || null;
    if (a && !b) {
      t.bracket.push({
        id: uid("br"),
        round: nextRound,
        a,
        b: null,
        winnerId: a,
        matchId: null,
        bye: true
      });
    } else {
      const m = createMatch(state, {
        gameId: t.gameId,
        hostId: a,
        rated: true,
        tournamentId: t.id
      });
      joinMatch(state, m.match.id, b);
      t.bracket.push({
        id: uid("br"),
        round: nextRound,
        a,
        b,
        winnerId: null,
        matchId: m.match.id,
        bye: false
      });
    }
  }
  t.updatedAt = Date.now();
  // recurse if only byes
  tryAdvanceRounds(state, t);
}

/** Pay tournament prize in YC (optional currency state). */
export function payoutTournamentPrize(state, currencyState, tournamentId) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return { ok: false, reason: "not_found" };
  if (t.status !== "finished" || !t.winnerId) return { ok: false, reason: "not_finished" };
  if (!t.prizeYc || t.prizePaid) return { ok: false, reason: "no_prize" };
  if (!currencyState) return { ok: false, reason: "no_currency" };
  ensureWallet(currencyState, t.winnerId);
  credit(currencyState, t.winnerId, t.prizeYc, {
    type: "reward",
    note: `tournament:${t.id}`
  });
  t.prizePaid = true;
  return { ok: true, winnerId: t.winnerId, amount: t.prizeYc };
}

export function listTournaments(state, { gameId = null, status = null, limit = 20 } = {}) {
  let list = state.tournaments.slice();
  if (gameId) list = list.filter((t) => t.gameId === gameId);
  if (status) list = list.filter((t) => t.status === status);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, limit).map(snapshotTournament);
}

export function leaderboard(state, gameId, { limit = 10 } = {}) {
  if (!gameOk(gameId)) return [];
  const rows = [];
  for (const [userId, games] of Object.entries(state.ratings)) {
    if (games[gameId] != null) rows.push({ userId, rating: games[gameId] });
  }
  rows.sort((a, b) => b.rating - a.rating);
  return rows.slice(0, limit);
}

export function summarizeGames(state) {
  const active = state.matches.filter((m) => m.status === "active" || m.status === "waiting").length;
  const openT = state.tournaments.filter((t) => t.status === "open" || t.status === "running").length;
  return `${active} matches · ${openT} tournaments · ${GAME_IDS.length} games`;
}
