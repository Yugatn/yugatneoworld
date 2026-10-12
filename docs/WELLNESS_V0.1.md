# Wellness · fitness · yoga aura · doctor booking v0.1

## Consent first

Avatar body and yoga-aura change **only** if the user opts in:

- `consent.fitnessAffectsAvatar`
- `consent.yogaAffectsAvatar`
- `consent.shareWithFitnessNetwork`
- `consent.healthBooking` (required to book a doctor)

Default: all **false**.

`setWellnessConsent(state, { fitnessAffectsAvatar: true, … })`

## Gym → body

Official fitness centres (`FITNESS_NETWORK`, kind `gym`).

- `completeGymSession(wellness, avatar, { centerId, minutes })`
- Points → stages: `default` → `toned` → `athletic` → `strong`
- With consent: updates `avatar.base.body` + `fitness.muscleTone` + temp `post_workout`

## Yoga → aura

Official yoga center or **official yoga live stream**.

- `completeYogaSession(..., { viaStream: true })`
- Points → `yogaAura` 0–5
- With consent: `fitness.yogaAura` + temp `yoga_aura`

## Fitness network

- `listFitnessCenters` / `linkFitnessCenter`
- City places: gym, yoga (existing street map)

## Doctor

- `listDoctors` / `bookDoctor` / `cancelAppointment`
- Needs `healthBooking` consent
- Laptop / city portal: `wellness.doctor`

## Voice

- фитнес · йога · запись к врачу · согласие на фитнес
