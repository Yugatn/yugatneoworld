# Health & illness v0.1

## Vitals (0–100)

- **energy** — drops over time / illness; restored by sleep & food
- **immunity** — resistance to catching illness
- **stress** — raises risk / burnout
- **hunger** — rises with time; reduced by `eatMeal`

## Illnesses

| id | name | blocks gym |
|----|------|------------|
| cold | Простуда | no |
| flu | Грипп | yes |
| injury | Травма | yes |
| burnout | Выгорание | no |
| foodborne | Несварение | no |

- `catchIllness(state, id, { force })` — risk from low immunity + high stress
- `treatAtHome(state, remedyId)` — rest, tea, otc, bandage
- `healAtDoctor(state)` — strong recovery (after wellness appointment)
- `restSleep` / `tickHealth` / `eatMeal`

## Avatar

`applyHealthToAvatar` → temps `sick`, `fever`, `pale` + `avatar.health`

## Integration

- `canExercise(health)` — false when severe illness
- Doctor booking (wellness) + `healAtDoctor`
- Bed / sofa → rest; fridge → eat; cabinet → treat

## Voice

здоровье · я заболел · полечиться · отдохнуть
