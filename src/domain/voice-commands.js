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
  // Smart home
  { id: "smarthome.panel", label: "Smart home", aliases: ["smart home", "smarthome", "умный дом", "умныйдом", "home control", "управление домом"] },
  { id: "lights.on", label: "Lights on", aliases: ["lights on", "turn on lights", "включи свет", "свет включить", "включи освещение", "turn the lights on"] },
  { id: "lights.off", label: "Lights off", aliases: ["lights off", "turn off lights", "выключи свет", "свет выключить", "выключи освещение", "turn the lights off"] },
  { id: "light.toggle", label: "Toggle light", aliases: ["toggle light", "light", "switch light", "переключи свет", "свет"] },
  { id: "climate.warmer", label: "Warmer", aliases: ["warmer", "heat up", "теплее", "потеплее", "увеличь температуру"] },
  { id: "climate.cooler", label: "Cooler", aliases: ["cooler", "colder", "холоднее", "похолоднее", "уменьши температуру"] },
  { id: "tv.toggle", label: "Toggle TV", aliases: ["tv", "television", "toggle tv", "turn on tv", "turn off tv", "телевизор", "включи телевизор", "выключи телевизор"] },
  { id: "music.toggle", label: "Toggle music", aliases: ["music", "toggle music", "play music", "stop music", "музыка", "включи музыку", "выключи музыку"] },
  // Avatar / appearance
  { id: "avatar.wardrobe", label: "Wardrobe", aliases: ["wardrobe", "clothes", "change clothes", "outfit", "шкаф", "одежда", "переодеться", "гардероб"] },
  { id: "avatar.appearance", label: "Appearance", aliases: ["appearance", "look", "my look", "внешность", "как я выгляжу", "внешний вид"] },
  { id: "avatar.shave", label: "Shave", aliases: ["shave", "shave me", "побрить", "побрей", "побриться", "бритьё"] },
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
