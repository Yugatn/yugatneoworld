import { createInventory } from "./inventory.js";
import { createSocialState } from "./social.js";

export function ensureWorldState(world) {
  if (!world.inventory) world.inventory = createInventory();
  if (!world.social) world.social = createSocialState();
  if (!world.permissions) {
    world.permissions = {
      apartment: "private",
      visitors: "approval_required"
    };
  }
  return world;
}
