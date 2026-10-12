import { GAME_CATALOG, createTournament } from "../src/domain/game-tournaments.js";
const STORAGE_KEY = "yugatn-eworld:game-tournaments:v1";
const GAME_LABELS = Object.fromEntries(Object.entries(GAME_CATALOG).map(([id, game]) => [id, game.name]));
const FORMAT_LABELS = { "single-elimination": "На выбывание", "round-robin": "Круговой" };
const $ = (id) => document.getElementById(id);
function safeRead() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((x) => x && typeof x.id === "string") : [];
  } catch { return []; }
}
function safeWrite(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
  catch { return false; }
}
function renderTournaments() {
  const host = $("tournaments");
  host.replaceChildren();
  const items = safeRead().sort((a,b) => b.createdAt - a.createdAt);
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Пока нет турниров. Создайте первый.";
    host.append(empty);
    return;
  }
  for (const item of items) {
    const row = document.createElement("div"); row.className = "entry";
    const details = document.createElement("div");
    const title = document.createElement("strong"); title.textContent = item.name;
    const meta = document.createElement("div"); meta.className = "muted";
    meta.textContent = `${GAME_LABELS[item.game] || item.game} · ${FORMAT_LABELS[item.format] || item.format} · ${item.participants?.length || 0} участник(ов)`;
    details.append(title, meta);
    const remove = document.createElement("button"); remove.className = "secondary";
    remove.type = "button"; remove.textContent = "Удалить"; remove.setAttribute("aria-label", `Удалить турнир ${item.name}`);
    remove.addEventListener("click", () => {
      if (safeWrite(safeRead().filter((x) => x.id !== item.id))) renderTournaments();
      else alert("Не удалось сохранить изменения в браузере.");
    });
    row.append(details, remove); host.append(row);
  }
}
$("tournamentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const item = createTournament({
      name: $("tName").value, game: $("tGame").value,
      format: $("tFormat").value, player: $("tPlayer").value
    });
    if (!safeWrite([item, ...safeRead()])) throw new Error("Хранилище браузера недоступно");
    $("tName").value = ""; renderTournaments();
  } catch (error) { alert(error.message || "Не удалось создать турнир."); }
});

let cells = Array(9).fill("");
let turn = "X";
let finished = false;
const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function outcome() {
  if (wins.some(([a,b,c]) => cells[a] && cells[a] === cells[b] && cells[a] === cells[c])) return turn + " победил!";
  if (cells.every(Boolean)) return "Ничья.";
  return null;
}
function renderBoard() {
  const board = $("board"); board.replaceChildren();
  cells.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell"; button.type = "button";
    button.textContent = value; button.disabled = finished || Boolean(value);
    button.setAttribute("aria-label", `Клетка ${index + 1}${value ? ": " + value : ""}`);
    button.addEventListener("click", () => {
      if (finished || cells[index]) return;
      cells[index] = turn;
      const result = outcome();
      if (result) { finished = true; $("turn").textContent = result; }
      else { turn = turn === "X" ? "O" : "X"; $("turn").textContent = "Ход " + turn; }
      renderBoard();
    });
    board.append(button);
  });
}
function resetGame() { cells = Array(9).fill(""); turn = "X"; finished = false; $("turn").textContent = "Ход X"; renderBoard(); }
$("playTtt").addEventListener("click", () => { $("playPanel").hidden = false; resetGame(); $("playPanel").scrollIntoView({ behavior: "smooth", block: "start" }); });
$("closeGame").addEventListener("click", () => { $("playPanel").hidden = true; });
$("resetGame").addEventListener("click", resetGame);
renderTournaments();
