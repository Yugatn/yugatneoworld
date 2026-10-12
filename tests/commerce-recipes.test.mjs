import assert from "node:assert/strict";
import {
  getCatalog,
  getBathroomCatalog,
  createOrder,
  createOrderBook,
  placeAndConfirm,
  tickAllDeliveries,
  findItemAnywhere,
  draftOrderForIngredients,
  supplyQty
} from "../src/domain/commerce.js";
import {
  listRecipes,
  getRecipe,
  missingIngredients,
  orderIngredientsForRecipe
} from "../src/domain/recipes.js";
import { useBathroom, listBathActions } from "../src/domain/bathroom.js";
import { createAvatarState, hasTemp } from "../src/domain/avatar.js";
import { ROOMS } from "../src/domain/apartment.js";
import { createDefaultWorld, WORLD_VERSION } from "../src/domain/world.js";

assert.ok(ROOMS.bathroom);
assert.ok(ROOMS.kidsRoom);
assert.ok(WORLD_VERSION >= 8);
const world = createDefaultWorld();
assert.ok(world.commerce);
assert.ok(world.objects.some((o) => o.roomId === "bathroom"));
assert.ok(world.objects.some((o) => o.id === "recipe-book"));

// Catalogs
assert.ok(getBathroomCatalog()[0].items.some((i) => i.id === "shampoo"));
assert.ok(findItemAnywhere("eggs"));
assert.ok(getCatalog({ category: "household" }).length >= 1);

// Order → deliver → supplies
const book = createOrderBook();
const draft = createOrder("bath-shop", "shampoo", 2);
assert.equal(draft.status, "draft");
placeAndConfirm(book, draft, { eta: "express", now: 1000 });
assert.equal(book.orders[0].status, "delivering");
tickAllDeliveries(book, 1000 + 16 * 60 * 1000);
assert.equal(book.orders[0].status, "delivered");
assert.equal(supplyQty(book.supplies, "shampoo"), 2);

// Multi ingredient draft
const multi = draftOrderForIngredients(["eggs", "butter", "shampoo"]);
assert.ok(multi.lines.length >= 3);

// Recipes
const recipes = listRecipes({ tag: "breakfast" });
assert.ok(recipes.length >= 2);
const eggs = getRecipe("scrambled-eggs");
assert.ok(eggs);
const miss = missingIngredients(eggs, {});
assert.ok(miss.length >= 2);
const ordered = orderIngredientsForRecipe(eggs, {});
assert.ok(ordered.ok && ordered.order);
assert.ok(ordered.order.recipeId === "scrambled-eggs");

const stocked = orderIngredientsForRecipe(eggs, { eggs: 5, butter: 5, salt: 5 });
assert.equal(stocked.order, null);

// Bathroom use
assert.ok(listBathActions().length >= 2);
const av = createAvatarState();
const bath = useBathroom("shower", book.supplies, av, 2000);
assert.equal(bath.ok, true);
assert.ok(bath.consumed.includes("shampoo"));
assert.ok(hasTemp(av, "wet_hair", 2000));

console.log("commerce-recipes tests OK");
