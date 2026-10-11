/**
 * Kitchen recipe book — useful everyday recipes.
 * Ingredient ids match commerce grocery catalog where possible.
 */

import { draftOrderForIngredients, findItemAnywhere } from "./commerce.js";

export const RECIPES = Object.freeze([
  {
    id: "scrambled-eggs",
    name: "Scrambled eggs",
    nameRu: "Яичница-болтунья",
    timeMin: 10,
    difficulty: "easy",
    tags: ["breakfast", "quick"],
    ingredients: [
      { itemId: "eggs", qty: 1, note: "2–3 eggs" },
      { itemId: "butter", qty: 1, note: "a knob" },
      { itemId: "salt", qty: 1, note: "pinch" }
    ],
    steps: [
      "Crack eggs into a bowl, add salt, beat lightly.",
      "Melt butter in a pan on medium heat.",
      "Pour eggs, stir gently until just set.",
      "Serve warm."
    ]
  },
  {
    id: "tomato-pasta",
    name: "Simple tomato pasta",
    nameRu: "Паста с томатами",
    timeMin: 25,
    difficulty: "easy",
    tags: ["lunch", "dinner"],
    ingredients: [
      { itemId: "pasta-dry", qty: 1 },
      { itemId: "tomato", qty: 1 },
      { itemId: "garlic", qty: 1 },
      { itemId: "olive-oil", qty: 1 },
      { itemId: "salt", qty: 1 }
    ],
    steps: [
      "Boil pasta in salted water until al dente.",
      "Sauté garlic in olive oil, add chopped tomatoes.",
      "Simmer 8–10 minutes, toss with pasta."
    ]
  },
  {
    id: "chicken-rice",
    name: "Chicken with rice",
    nameRu: "Курица с рисом",
    timeMin: 40,
    difficulty: "medium",
    tags: ["dinner"],
    ingredients: [
      { itemId: "chicken", qty: 1 },
      { itemId: "rice", qty: 1 },
      { itemId: "onion", qty: 1 },
      { itemId: "garlic", qty: 1 },
      { itemId: "olive-oil", qty: 1 },
      { itemId: "salt", qty: 1 }
    ],
    steps: [
      "Season chicken, brown in oil.",
      "Sauté onion and garlic, add rice and water.",
      "Nestle chicken on top, cover, simmer until done."
    ]
  },
  {
    id: "veggie-soup",
    name: "Vegetable soup",
    nameRu: "Овощной суп",
    timeMin: 35,
    difficulty: "easy",
    tags: ["lunch", "light"],
    ingredients: [
      { itemId: "potato", qty: 1 },
      { itemId: "onion", qty: 1 },
      { itemId: "carrot", qty: 1 },
      { itemId: "salt", qty: 1 }
    ],
    steps: [
      "Chop vegetables.",
      "Simmer in water with salt 25–30 minutes.",
      "Adjust seasoning and serve."
    ]
  },
  {
    id: "yogurt-fruit",
    name: "Yogurt with fruit",
    nameRu: "Йогурт с фруктами",
    timeMin: 5,
    difficulty: "easy",
    tags: ["breakfast", "snack", "quick"],
    ingredients: [
      { itemId: "yogurt", qty: 1 },
      { itemId: "fruit", qty: 1 }
    ],
    steps: ["Slice fruit, mix into yogurt, serve cold."]
  },
  {
    id: "garlic-bread",
    name: "Garlic bread",
    nameRu: "Чесночный хлеб",
    timeMin: 15,
    difficulty: "easy",
    tags: ["side", "quick"],
    ingredients: [
      { itemId: "bread", qty: 1 },
      { itemId: "butter", qty: 1 },
      { itemId: "garlic", qty: 1 }
    ],
    steps: [
      "Mix soft butter with minced garlic.",
      "Spread on bread, toast until golden."
    ]
  }
]);

/** Optional ingredient not always in grocery — map aliases. */
const INGREDIENT_ALIASES = Object.freeze({
  carrot: "onion" // fallback if carrot not stocked: still order a veg; UI can note substitution
});

export function listRecipes(filter = {}) {
  let list = RECIPES.map((r) => ({
    ...r,
    ingredients: r.ingredients.map((i) => ({ ...i })),
    steps: [...r.steps],
    tags: [...r.tags]
  }));
  if (filter.tag) list = list.filter((r) => r.tags.includes(filter.tag));
  if (filter.difficulty) list = list.filter((r) => r.difficulty === filter.difficulty);
  if (filter.maxTime != null) list = list.filter((r) => r.timeMin <= filter.maxTime);
  return list;
}

export function getRecipe(id) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) return null;
  return {
    ...r,
    ingredients: r.ingredients.map((i) => ({ ...i })),
    steps: [...r.steps],
    tags: [...r.tags]
  };
}

/** Resolve ingredient item ids (with aliases) that exist in commerce. */
export function resolveIngredientIds(recipe) {
  const ids = [];
  for (const ing of recipe.ingredients || []) {
    let id = ing.itemId;
    if (!findItemAnywhere(id) && INGREDIENT_ALIASES[id]) id = INGREDIENT_ALIASES[id];
    if (findItemAnywhere(id)) ids.push(id);
  }
  return [...new Set(ids)];
}

/**
 * Compare recipe needs vs home supplies stock.
 * supplies: { [itemId]: qty }
 */
export function missingIngredients(recipe, supplies = {}) {
  const missing = [];
  for (const ing of recipe.ingredients || []) {
    let id = ing.itemId;
    if (!findItemAnywhere(id) && INGREDIENT_ALIASES[id]) id = INGREDIENT_ALIASES[id];
    const need = Math.max(1, Number(ing.qty) || 1);
    const have = Number(supplies[id]) || 0;
    if (have < need) missing.push({ itemId: id, need: need - have, name: findItemAnywhere(id)?.item?.name || id });
  }
  return missing;
}

/** Draft a home-delivery order for everything the recipe still needs. */
export function orderIngredientsForRecipe(recipe, supplies = {}) {
  const missing = missingIngredients(recipe, supplies);
  if (!missing.length) return { ok: true, order: null, message: "All ingredients already in stock." };
  const lines = missing.map((m) => {
    const hit = findItemAnywhere(m.itemId);
    return hit ? { vendorId: hit.vendor.id, itemId: m.itemId, qty: m.need } : null;
  }).filter(Boolean);
  const order = draftOrderForIngredients(
    lines.map((l) => l.itemId),
    { qty: 1 }
  );
  // Adjust qty per missing line
  if (order) {
    for (const line of order.lines) {
      const m = missing.find((x) => x.itemId === line.itemId);
      if (m) {
        line.qty = m.need;
        line.lineTotal = Math.round(line.price * line.qty * 100) / 100;
      }
    }
    order.total = Math.round(order.lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    order.recipeId = recipe.id;
    order.recipeName = recipe.name;
  }
  return { ok: Boolean(order), order, missing };
}

export function summarizeRecipe(recipe) {
  const ings = (recipe.ingredients || []).map((i) => i.itemId).join(", ");
  return `${recipe.name} (${recipe.timeMin} min, ${recipe.difficulty}) — ${ings}`;
}
