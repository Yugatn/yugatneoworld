# Achievements & activity feed v0.1

## Achievements

Badges for social, **games**, commerce, wellness, school, identity, privacy.

### Game badges

| id | Title | Trigger |
|----|-------|--------|
| first_match | Дебют | 1 партия |
| matches_10 / matches_50 | Завсегдатай / Ветеран | 10 / 50 партий |
| wins_5 / wins_15 / wins_30 | Пятёрка / Серия / Мастер | 5 / 15 / 30 побед |
| chess_win / chess_wins_5 | Шах и мат / Шахматист | 1 / 5 побед в шахматы |
| checkers_win / checkers_wins_5 | Дамка / Шашист | 1 / 5 побед в шашки |
| monopoly_play / monopoly_win | Монополист / Король недвижимости | партия / победа |
| tictactoe_win / tictactoe_wins_10 | Крест накрест / Ноликовый стратег | 1 / 10 |
| reversi_win | Переворот | победа в реверси |
| tournament_join / host / champ | Участник / Организатор / Чемпион | турнир |
| polyglot_gamer | Универсал | все 5 игр каталога |
| rated_win | Рейтинговая победа | rated match |

### API

- `bumpProgress(state, userId, key, delta)`
- `recordGameEvent(state, userId, { gameId, result, rated, tournament* })` — удобный хук из `games.js`
- `listGameAchievements()` — только category `games`
- `unlockAchievement` · `claimAchievementReward`

Progress keys (games): `matches`, `wins`, `chess_wins`, `checkers_wins`, `monopoly_plays`, `monopoly_wins`, `tictactoe_wins`, `reversi_wins`, `played_*`, `tournament_joins`, `tournament_hosts`, `tournament_wins`, `rated_wins`

## Feed

Public wall posts: status · achievement · game · marketplace · system

## World

Trophy shelf · `WORLD_VERSION` **25**

## Voice

достижения · лента · новый пост
