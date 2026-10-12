export const GAME_CATALOG = Object.freeze({
  chess: { name: "Шахматы", status: "planned", players: [2] },
  checkers: { name: "Шашки", status: "planned", players: [2] },
  monopoly: { name: "Монополия", status: "planned", players: [2, 3, 4, 5, 6] },
  "tic-tac-toe": { name: "Крестики-нолики", status: "playable-local", players: [2] },
  sudoku: { name: "Судоку", status: "planned", players: [1] },
  logic: { name: "Логические дуэли", status: "planned", players: [2] }
});
export const TOURNAMENT_FORMATS = Object.freeze(["single-elimination", "round-robin"]);
export function createTournament({ name, game, format, player }, now = Date.now(), id = "local-tournament") {
  const clean = (v, max) => String(v ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, max);
  const tournamentName = clean(name, 64);
  const playerName = clean(player, 24);
  if (!tournamentName || !playerName) throw new TypeError("Название и псевдоним обязательны");
  if (!Object.hasOwn(GAME_CATALOG, game)) throw new TypeError("Неизвестная игра");
  if (!TOURNAMENT_FORMATS.includes(format)) throw new TypeError("Неизвестный формат");
  return {
    id: String(id), name: tournamentName, game, format, createdAt: now,
    status: "registration", participants: [{ id: "local-player", name: playerName }],
    persistence: "local-only"
  };
}
export function addParticipant(tournament, participant) {
  if (!tournament || tournament.status !== "registration") throw new TypeError("Регистрация закрыта");
  const name = String(participant?.name ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 24);
  const id = String(participant?.id ?? "").trim().slice(0, 64);
  if (!name || !id) throw new TypeError("Нужны идентификатор и имя участника");
  if (tournament.participants.some((p) => p.id === id)) return tournament;
  return { ...tournament, participants: [...tournament.participants, { id, name }] };
}
export function createSingleEliminationRounds(participants) {
  if (!Array.isArray(participants) || participants.length < 2) return [];
  const size = 2 ** Math.ceil(Math.log2(participants.length));
  const slots = [...participants.map((p) => ({ id: String(p.id), name: String(p.name) }))];
  while (slots.length < size) slots.push(null);
  const rounds = [];
  let current = slots;
  while (current.length > 1) {
    const matches = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i], b = current[i + 1];
      matches.push({ id: `r${rounds.length + 1}-m${matches.length + 1}`, a, b, bye: Boolean(a && !b), winnerId: a && !b ? a.id : null });
    }
    rounds.push(matches);
    current = matches.map(() => null);
  }
  return rounds;
}
