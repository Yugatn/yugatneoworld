/**
 * Voice command parser for Yugatn eWorld.
 * Maps free-form speech (ru/en) to action ids. Browser SpeechRecognition
 * supplies the transcript; this module stays pure for Node tests.
 */

/** @typedef {{ id: string, label: string, aliases: string[] }} VoiceCommandDef */

export const VOICE_COMMANDS = /** @type {VoiceCommandDef[]} */ ([
  { id: "door.open", label: "Open door", aliases: ["open door", "unlock door", "открой дверь", "открыть дверь", "дверь открыть"] },
  { id: "door.close", label: "Close door", aliases: ["close door", "lock door", "закрой дверь", "закрыть дверь", "дверь закрыть"] },
  { id: "interact", label: "Interact", aliases: ["interact", "use", "action", "взаимодействуй", "действие", "использовать"] },
  { id: "street", label: "Go to street", aliases: ["go to street", "street", "city", "outside", "на улицу", "улица", "город", "выйти"] },
  { id: "home", label: "Return home", aliases: ["go home", "apartment", "home", "домой", "квартира", "вернуться"] },
  { id: "inventory", label: "Inventory", aliases: ["inventory", "furniture", "инвентарь", "мебель", "предметы"] },
  { id: "multiplayer", label: "Multiplayer", aliases: ["multiplayer", "players", "мультиплеер", "игроки", "комната"] },
  { id: "account", label: "Account", aliases: ["account", "profile", "аккаунт", "профиль"] },
  { id: "save", label: "Save", aliases: ["save", "сохрани", "сохранить"] },
  { id: "emote.wave", label: "Wave", aliases: ["wave", "привет", "помахай", "махай"] },
  { id: "emote.heart", label: "Heart", aliases: ["heart", "love", "сердце", "люблю"] },
  { id: "emote.clap", label: "Clap", aliases: ["clap", "applaud", "хлопай", "аплодисменты"] },
  { id: "emote.think", label: "Think", aliases: ["think", "hmm", "подумай", "думаю"] },
  { id: "emote.hello", label: "Hello", aliases: ["hello", "hi", "hello chat", "приветствие"] },
  { id: "help", label: "Help", aliases: ["help", "commands", "помощь", "команды", "что умеешь"] }
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match transcript to the best command.
 * @returns {{ id: string, label: string, score: number } | null}
 */
export function matchVoiceCommand(transcript) {
  const t = normalize(transcript);
  if (!t || t.length < 2) return null;

  let best = null;
  for (const cmd of VOICE_COMMANDS) {
    for (const alias of cmd.aliases) {
      const a = normalize(alias);
      if (!a) continue;
      let score = 0;
      if (t === a) score = 100;
      else if (t.includes(a)) score = 80 + Math.min(19, a.length);
      else if (a.includes(t) && t.length >= 4) score = 50;
      else {
        const tt = new Set(t.split(" "));
        const aa = a.split(" ");
        const hit = aa.filter((w) => tt.has(w)).length;
        if (hit > 0 && hit === aa.length) score = 70;
        else if (hit >= 2) score = 40 + hit * 5;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { id: cmd.id, label: cmd.label, score };
      }
    }
  }
  return best && best.score >= 40 ? best : null;
}

export function listVoiceHelp() {
  return VOICE_COMMANDS.map((c) => c.label + ": " + c.aliases.slice(0, 3).join(" / "));
}

/** Feature detection helper (browser only). */
export function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
