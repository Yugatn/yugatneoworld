/** Voice command parser for Yugatn eWorld. */

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
  { id: "smarthome.panel", label: "Smart home", aliases: ["smart home", "smarthome", "умный дом", "умныйдом", "home control", "управление домом"] },
  { id: "lights.on", label: "Lights on", aliases: ["lights on", "turn on lights", "включи свет", "свет включить", "включи освещение", "turn the lights on"] },
  { id: "lights.off", label: "Lights off", aliases: ["lights off", "turn off lights", "выключи свет", "свет выключить", "выключи освещение", "turn the lights off"] },
  { id: "light.toggle", label: "Toggle light", aliases: ["toggle light", "light", "switch light", "переключи свет", "свет"] },
  { id: "climate.warmer", label: "Warmer", aliases: ["warmer", "heat up", "теплее", "потеплее", "увеличь температуру"] },
  { id: "climate.cooler", label: "Cooler", aliases: ["cooler", "colder", "холоднее", "похолоднее", "уменьши температуру"] },
  { id: "tv.toggle", label: "Toggle TV", aliases: ["tv", "television", "toggle tv", "turn on tv", "turn off tv", "телевизор", "включи телевизор", "выключи телевизор"] },
  { id: "music.toggle", label: "Toggle music", aliases: ["music", "toggle music", "play music", "stop music", "музыка", "включи музыку", "выключи музыку"] },
  { id: "avatar.wardrobe", label: "Wardrobe", aliases: ["wardrobe", "clothes", "change clothes", "outfit", "шкаф", "одежда", "переодеться", "гардероб"] },
  { id: "avatar.appearance", label: "Appearance", aliases: ["appearance", "look", "my look", "внешность", "как я выгляжу", "внешний вид"] },
  { id: "avatar.shave", label: "Shave", aliases: ["shave", "shave me", "побрить", "побрей", "побриться", "бритьё"] },
  { id: "avatar.shop", label: "Clothing shop", aliases: ["clothing shop", "avatar shop", "buy clothes", "магазин одежды", "магазин аватара", "купить одежду"] },
  { id: "avatar.secondhand", label: "Second-hand", aliases: ["second hand", "secondhand", "resale", "секонд хенд", "секонд-хенд", "вторичный рынок", "перепродажа"] },
  { id: "fashion.real", label: "Real fashion markets", aliases: ["real clothes", "fashion market", "buy real clothes", "настоящая одежда", "маркет одежды", "купить одежду себе"] },
  { id: "room.living", label: "Living room", aliases: ["living room", "lounge", "go to living room", "гостиная", "в гостиную", "зал"] },
  { id: "room.kids", label: "Kids room", aliases: ["kids room", "nursery", "children's room", "go to kids room", "детская", "в детскую", "комната детей"] },
  { id: "room.bathroom", label: "Bathroom", aliases: ["bathroom", "go to bathroom", "ванна", "ванная", "в ванную", "туалет"] },
  { id: "room.kitchen", label: "Kitchen", aliases: ["kitchen", "go to kitchen", "кухня", "на кухню"] },
  { id: "room.bedroom", label: "Bedroom", aliases: ["bedroom", "go to bedroom", "спальня", "в спальню"] },
  { id: "room.study", label: "Study", aliases: ["study", "office", "go to study", "кабинет", "в кабинет"] },
  { id: "shop.open", label: "Shop delivery", aliases: ["shop", "order delivery", "delivery", "магазин", "доставка", "заказать", "заказ"] },
  { id: "shop.bathroom", label: "Bath products", aliases: ["order shampoo", "bath products", "shampoo", "шампунь", "мыло", "полотенце", "товары для ванны"] },
  { id: "recipe.list", label: "Recipes", aliases: ["recipes", "recipe book", "cook", "рецепты", "книга рецептов", "что приготовить"] },
  { id: "bathroom.shower", label: "Shower", aliases: ["take a shower", "shower", "душ", "принять душ"] },
  { id: "bathroom.bath", label: "Bath", aliases: ["take a bath", "bath", "принять ванну", "лечь в ванну"] },
  { id: "schedule.view", label: "Schedule", aliases: ["schedule", "calendar", "reminders", "расписание", "календарь", "напоминания", "уроки"] },
  { id: "schedule.due", label: "Due reminders", aliases: ["what is next", "due reminders", "что дальше", "ближайшие дела", "напоминание"] },
  { id: "class.list", label: "Classes", aliases: ["classes", "my classes", "классы", "мои классы", "уроки класс"] },
  { id: "class.create", label: "Create class", aliases: ["create class", "new class", "создать класс", "новый класс"] },
  { id: "presentation.list", label: "Presentations", aliases: ["presentations", "product pitch", "презентации", "презентация продукта"] },
  { id: "presentation.host", label: "Host presentation", aliases: ["host presentation", "start pitch", "провести презентацию", "презентация"] },
  { id: "school.enter", label: "School mode", aliases: ["school mode", "enter school", "режим школы", "школьный режим", "школа", "режим школа", "в школу"] },
  { id: "school.teacher", label: "Teacher role", aliases: ["teacher mode", "i am a teacher", "i'm a teacher", "я учитель", "роль учителя", "режим учителя", "войти как учитель"] },
  { id: "school.admin", label: "Admin role", aliases: ["admin mode", "i am admin", "i'm an administrator", "я администратор", "роль администратора", "режим администратора", "войти как администратор"] },
  { id: "school.exit", label: "Exit school mode", aliases: ["exit school", "leave school", "выйти из школы", "домой из школы", "выйти из школьного режима", "закрыть школу"] },
  { id: "bulletin.view", label: "Bulletin board", aliases: ["bulletin board", "notice board", "announcements", "доска объявлений", "объявления", "доска"] },
  { id: "bulletin.post", label: "New announcement", aliases: ["new announcement", "post bulletin", "новое объявление", "написать объявление", "опубликовать объявление"] },
  { id: "embed.attach", label: "Attach media", aliases: ["attach video", "attach youtube", "attach document", "прикрепить видео", "прикрепить ютуб", "прикрепить документ", "вставить ссылку"] },
  { id: "travel.air", label: "Air tickets", aliases: ["air tickets", "flight tickets", "buy flight", "авиабилеты", "билет на самолёт", "самолёт"] },
  { id: "travel.rail", label: "Rail tickets", aliases: ["train tickets", "rail tickets", "buy train", "билеты на поезд", "жд билеты", "поезд"] },
  { id: "cinema.invite", label: "Invite to cinema", aliases: ["invite to cinema", "invite friends to watch", "пригласить в кино", "пригласить друзей в кино", "смотреть кино вместе"] },
  { id: "podcast.play", label: "Play podcast", aliases: ["podcast", "play podcast", "listen to podcast", "подкаст", "слушать подкаст", "включить подкаст"] },
  { id: "podcast.live", label: "Live podcast", aliases: ["live podcast", "podcast stream", "go live podcast", "прямой эфир", "трансляция подкаста", "эфир подкаста", "начать эфир"] },
  { id: "wellness.gym", label: "Fitness / gym", aliases: ["gym", "fitness", "workout", "fitness center", "фитнес", "тренажёрный зал", "тренировка", "зал"] },
  { id: "wellness.yoga", label: "Yoga", aliases: ["yoga", "yoga center", "йога", "йога центр", "занятие йогой"] },
  { id: "wellness.doctor", label: "Book doctor", aliases: ["book doctor", "doctor appointment", "see a doctor", "запись к врачу", "записать к врачу", "врач"] },
  { id: "wellness.consent", label: "Wellness consent", aliases: ["fitness consent", "avatar fitness consent", "согласие на фитнес", "согласие на данные фитнеса", "согласие йога"] },
  { id: "health.status", label: "Health status", aliases: ["health", "my health", "how am i", "здоровье", "как самочувствие", "состояние здоровья"] },
  { id: "health.sick", label: "Feeling sick", aliases: ["i am sick", "feeling sick", "я заболел", "я болею", "плохо себя чувствую"] },
  { id: "health.treat", label: "Treat illness", aliases: ["take medicine", "treat myself", "полечиться", "принять лекарство", "аптечка"] },
  { id: "health.rest", label: "Rest / sleep", aliases: ["rest", "sleep", "go to bed", "отдохнуть", "поспать", "лечь спать"] },
  { id: "voting.open", label: "Voting", aliases: ["vote", "voting", "poll", "голосование", "голосовать", "опрос"] },
  { id: "identity.verify", label: "Identity verification", aliases: ["verify identity", "verification", "верификация", "подтвердить личность", "верифицировать"] },
  { id: "currency.balance", label: "Currency balance", aliases: ["balance", "my balance", "wallet", "баланс", "мой баланс", "кошелёк", "югатн коин"] },
  { id: "security.status", label: "Security", aliases: ["security", "security status", "privacy", "безопасность", "защита данных", "приватность"] },
  { id: "marketplace.open", label: "Marketplace", aliases: ["marketplace", "classifieds", "avito", "маркетплейс", "авито", "барахолка", "купить с рук", "частные объявления"] },
  { id: "marketplace.sell", label: "Sell on marketplace", aliases: ["sell item", "create listing", "продать товар", "подать объявление", "продать на авито", "новое объявление продажи"] },
  { id: "marketplace.browse", label: "Browse marketplace", aliases: ["browse marketplace", "search listings", "найти товар", "поиск объявлений", "смотреть объявления"] },
  { id: "payments.orders", label: "Payment orders", aliases: ["payment", "payments", "my orders", "оплата", "мои заказы", "платежи", "история оплаты"] },
  { id: "payments.escrow", label: "Escrow", aliases: ["escrow", "hold payment", "эскроу", "безопасная сделка", "холд оплаты"] },
  { id: "payments.confirm", label: "Confirm receipt", aliases: ["confirm receipt", "confirm purchase", "подтвердить получение", "подтвердить покупку", "получил товар"] },
  { id: "crypto.p2p", label: "P2P crypto exchange", aliases: ["crypto", "p2p", "p2p exchange", "крипта", "p2p обмен", "обменник", "пи ту пи", "криптообмен"] },
  { id: "crypto.pay", label: "Pay with crypto", aliases: ["pay with crypto", "crypto payment", "оплата usdt", "оплата криптой", "заплатить usdt", "пополнить криптой"] },
  { id: "browser.anonymous", label: "Anonymous browser", aliases: ["anonymous browser", "private browser", "tor browser", "анонимный браузер", "приватный браузер", "тор браузер", "открыть браузер"] },
  { id: "browser.search", label: "Private search", aliases: ["private search", "search the web", "приватный поиск", "поиск в браузере", "найти в браузере", "искать"] },
  { id: "browser.newcircuit", label: "New circuit", aliases: ["new circuit", "new identity", "новая цепочка", "новая личность", "сменить цепочку", "очистить следы"] },
  { id: "browser.close", label: "Close browser", aliases: ["close browser", "закрыть браузер", "выйти из браузера"] },
  { id: "games.play", label: "Games", aliases: ["games", "play games", "board games", "игры", "играть", "настольные игры", "игровой стол"] },
  { id: "games.chess", label: "Chess", aliases: ["chess", "play chess", "шахматы", "сыграть в шахматы", "партию шахмат"] },
  { id: "games.checkers", label: "Checkers", aliases: ["checkers", "draughts", "шашки", "сыграть в шашки"] },
  { id: "games.monopoly", label: "Monopoly", aliases: ["monopoly", "монополия", "сыграть в монополию"] },
  { id: "games.tournament", label: "Tournament", aliases: ["tournament", "cup", "турнир", "создать турнир", "шахматный турнир", "соревнование"] },
  { id: "social.friends", label: "Friends", aliases: ["friends", "my friends", "друзья", "мои друзья", "список друзей"] },
  { id: "social.invite", label: "Invite friend", aliases: ["invite", "invite friend", "пригласить", "приглашение", "позвать друга"] },
  { id: "social.requests", label: "Friend requests", aliases: ["friend requests", "заявки в друзья", "заявки", "новые друзья"] },
  { id: "notify.list", label: "Notifications", aliases: ["notifications", "alerts", "уведомления", "оповещения", "колокольчик"] },
  { id: "messenger.list", label: "Messages", aliases: ["messages", "inbox", "сообщения", "мессенджер", "личные сообщения", "входящие"] },
  { id: "messenger.send", label: "Send message", aliases: ["send message", "write message", "написать сообщение", "отправить сообщение", "написать другу"] },
  { id: "help", label: "Help", aliases: ["help", "commands", "помощь", "команды", "что умеешь"] }
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
