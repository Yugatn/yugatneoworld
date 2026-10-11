# Commerce & home delivery v0.1

Universal **buy + deliver to apartment** layer for the whole eWorld social experience — not limited to one room.

## Vendors

| Category | Shop id | Examples |
|----------|---------|----------|
| cafe / restaurant | cafe-1, restaurant-1 | coffee, soup |
| grocery | store-1 | eggs, pasta, chicken, fruit… |
| bathroom | bath-shop | shampoo, soap, towel, toothpaste… |
| household | home-shop | detergent, sponges, dish soap… |

## Orders

1. `createOrder` / `draftOrderForIngredients` / `draftOrderFromLines` → **draft**
2. `confirmOrder` → **delivering** + `deliverAt`
3. `tickDelivery` / `tickAllDeliveries` → stocks **supplies**, status **delivered**

State lives on `world.commerce = { orders, supplies }`.

## Bathroom

- Room `bathroom` with bath, shower, sink, cabinet.
- Cabinet / bath: `shop.bathroom` — order bath products with home delivery.
- `useBathroom("shower"|"bath"|"wash-hands", supplies, avatarState)` consumes shampoo/soap when in stock; may set avatar temp `wet_hair`.

## Kitchen recipes

- Object **Recipe book** (`recipe.list`, `recipe.order`).
- `listRecipes` / `getRecipe` — everyday recipes (eggs, pasta, soup…).
- `missingIngredients` vs pantry `supplies`.
- `orderIngredientsForRecipe` drafts a multi-line grocery delivery for what is missing.

## Entry points in the apartment

- Kitchen: fridge, pantry, delivery phone, recipe book
- Bathroom: cabinet, bathtub
- Living room / study laptop: `shop.browse` (any category)

## Not in v0.1

- Real payment / bank
- Split multi-vendor shipping fees
- Courier NPC on the street
- Shared household supplies between roommates
