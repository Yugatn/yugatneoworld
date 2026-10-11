/**
 * Browser voice UI — Web Speech API + command dispatch.
 */
import { matchVoiceCommand, listVoiceHelp } from "../domain/voice-commands.js";

export function runVoiceCommand(id, api) {
  switch (id) {
    case "door.open":
      if (!api.isDoorOpen()) api.toggleDoor();
      else api.showToast("Door already open");
      break;
    case "door.close":
      if (api.isDoorOpen()) api.toggleDoor();
      else api.showToast("Door already closed");
      break;
    case "interact":
      api.interact();
      break;
    case "street":
      api.openCity();
      break;
    case "home":
      api.returnHome();
      break;
    case "inventory":
      api.openInventory();
      break;
    case "multiplayer":
      api.openMultiplayer();
      break;
    case "account":
      api.openAccount();
      break;
    case "save":
      api.save();
      break;
    case "emote.wave":
    case "emote.heart":
    case "emote.clap":
    case "emote.think":
    case "emote.hello":
      api.emote(id.split(".")[1]);
      break;
    case "help":
      api.show("\ud83c\udf99 Voice commands", listVoiceHelp().slice(0, 10).join(". ") + ".", [
        ["Close", () => api.closePanel?.()]
      ]);
      break;
    default:
      api.showToast("Unknown command");
  }
}

export function attachVoice(api) {
  let recognition = null;
  let listening = false;
  const voiceBtn = api.voiceBtn;

  function setListening(on) {
    listening = on;
    if (voiceBtn) {
      voiceBtn.classList.toggle("listening", on);
      voiceBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function stopVoice() {
    try { recognition?.stop(); } catch {}
    setListening(false);
  }

  function startVoice() {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      api.showToast("Voice not supported in this browser");
      return;
    }
    if (listening) { stopVoice(); return; }
    if (!recognition) {
      recognition = new SR();
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.continuous = false;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = (ev) => {
        setListening(false);
        if (ev.error === "not-allowed") api.showToast("Microphone permission denied");
        else if (ev.error !== "aborted" && ev.error !== "no-speech") api.showToast("Voice: " + ev.error);
      };
      recognition.onresult = (ev) => {
        const alts = [];
        for (let i = 0; i < ev.results[0].length; i++) alts.push(ev.results[0][i].transcript);
        let matched = null;
        for (const t of alts) {
          matched = matchVoiceCommand(t);
          if (matched) break;
        }
        const heard = alts[0] || "";
        if (matched) {
          api.showToast("\ud83c\udf99 " + matched.label);
          runVoiceCommand(matched.id, api);
        } else {
          api.showToast("\ud83c\udf99 ? " + heard.slice(0, 40));
        }
      };
    }
    try {
      recognition.lang = (typeof navigator !== "undefined" && navigator.language?.startsWith("ru")) ? "ru-RU" : "en-US";
      recognition.start();
    } catch {
      api.showToast("Voice start failed");
      setListening(false);
    }
  }

  voiceBtn?.addEventListener("click", () => startVoice());
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startVoice();
      }
    });
  }

  return { startVoice, stopVoice, runVoiceCommand: (id) => runVoiceCommand(id, api) };
}
