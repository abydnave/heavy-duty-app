// Evan — Heavy Duty Programme (Mike Mentzer Style, 3-Day Split)
// restAfter: false = no rest (superset A→B, go immediately)
// restAfter: true or undefined = 2:30 rest timer after completing sets
export const programme = [
  {
    id: 'day1',
    label: 'Day 1 — Chest + Back',
    exercises: [
      { id: 'db-fly',              name: 'Dumbbell Fly',                 superset: 'A', restAfter: false },
      { id: 'bench-press',         name: 'Barbell Bench Press',          superset: 'A' },
      { id: 'straight-arm-pull',   name: 'Straight-arm Cable Pulldown', superset: 'B', restAfter: false },
      { id: 'bent-over-row',       name: 'Barbell Bent Over Row',       superset: 'B' },
      { id: 'chin-up',             name: 'Chin-up / Pull-up' },
      { id: 'back-extension-d1',   name: 'Back Extension' },
    ],
  },
  {
    id: 'day2',
    label: 'Day 2 — Legs + Abs/Low Back',
    exercises: [
      { id: 'squat',               name: 'Barbell Back Squat' },
      { id: 'rdl',                 name: 'Romanian Deadlift' },
      { id: 'leg-curl',            name: 'Leg Curl' },
      { id: 'hamstring-curl',      name: 'Hamstring Curl' },
      { id: 'calf-raise',          name: 'Standing Calf Raise' },
      { id: 'back-ext-crunch',     name: 'Back Extension / Weighted Crunch' },
    ],
  },
  {
    id: 'day3',
    label: 'Day 3 — Shoulders + Arms',
    exercises: [
      { id: 'lateral-raise',       name: 'Dumbbell Lateral Raise',      superset: 'A', restAfter: false },
      { id: 'ohp',                 name: 'Standing Barbell OHP',         superset: 'A' },
      { id: 'rear-delt-fly',       name: 'Bent Over Rear Delt DB Fly' },
      { id: 'barbell-curl',        name: 'Barbell Curl',                 superset: 'B', restAfter: false },
      { id: 'incline-db-curl',     name: 'Incline DB Curl / Hammer Curl',superset: 'B' },
      { id: 'cg-bench',            name: 'Close Grip Bench Press',       superset: 'C', restAfter: false },
      { id: 'tricep-pushdown',     name: 'Cable Triceps Pushdown',       superset: 'C' },
    ],
  },
]
