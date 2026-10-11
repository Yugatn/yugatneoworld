/**
 * Bathroom use — digital care actions that may consume delivered supplies.
 */

import { consumeSupply, supplyQty } from "./commerce.js";
import { applyTemp } from "./avatar.js";

export const BATH_ACTIONS = Object.freeze([
  {
    id: "shower",
    label: "Take a shower",
    labelRu: "Принять душ",
    prefers: ["shampoo", "shower-gel", "soap"],
    towel: true,
    temp: "wet_hair"
  },
  {
    id: "bath",
    label: "Take a bath",
    labelRu: "Принять ванну",
    prefers: ["bath-salt", "soap", "shampoo"],
    towel: true,
    temp: "wet_hair"
  },
  {
    id: "wash-hands",
    label: "Wash hands",
    labelRu: "Вымыть руки",
    prefers: ["soap"],
    towel: false,
    temp: null
  }
]);

/**
 * Use bathroom facility. Optionally consumes one preferred product + towel.
 * @returns {{ ok: boolean, message: string, consumed: string[] }}
 */
export function useBathroom(actionId, supplies, avatarState = null, now = Date.now()) {
  const action = BATH_ACTIONS.find((a) => a.id === actionId);
  if (!action) return { ok: false, message: "Unknown bathroom action", consumed: [] };

  const consumed = [];
  let productUsed = null;
  for (const id of action.prefers) {
    if (supplyQty(supplies, id) > 0) {
      consumeSupply(supplies, id, 1);
      consumed.push(id);
      productUsed = id;
      break;
    }
  }

  if (action.towel && supplyQty(supplies, "towel") > 0) {
    // Towels are reusable in v0.1 — do not consume, only note availability
  }

  if (action.temp && avatarState) {
    applyTemp(avatarState, action.temp, now);
  }

  const withWhat = productUsed ? ` (used ${productUsed})` : " (no bath product in stock — order delivery)";
  const towelNote = action.towel
    ? supplyQty(supplies, "towel") > 0
      ? " Towel ready."
      : " No towel in cabinet — consider ordering one."
    : "";

  return {
    ok: true,
    message: action.label + withWhat + "." + towelNote,
    consumed,
    actionId: action.id
  };
}

export function listBathActions() {
  return BATH_ACTIONS.map((a) => ({ id: a.id, label: a.label, labelRu: a.labelRu }));
}
