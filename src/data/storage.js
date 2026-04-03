const WORKOUTS_KEY = 'hd_workouts'
const CHECKINS_KEY = 'hd_checkins'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] }
  catch { return [] }
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Workouts ──

export function getWorkouts() {
  return read(WORKOUTS_KEY).map(normalizeWorkout)
}

/** Normalize old flat format to new per-exercise multi-set format */
function normalizeWorkout(w) {
  if (w.exercises) return w // already new format
  // Old format: sets: [{ exerciseId, weight, reps, effort }]
  const byEx = {}
  for (const s of (w.sets || [])) {
    if (!byEx[s.exerciseId]) byEx[s.exerciseId] = []
    byEx[s.exerciseId].push({
      weight: s.weight || 0,
      reps: s.reps || 0,
      completed: true,
    })
  }
  return {
    ...w,
    exercises: Object.entries(byEx).map(([exerciseId, sets]) => ({ exerciseId, sets })),
  }
}

export function saveWorkout(entry) {
  // entry: { dayId, exercises: [{ exerciseId, sets: [{ weight, reps, completed }] }] }
  const all = read(WORKOUTS_KEY)
  all.push({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() })
  write(WORKOUTS_KEY, all)
}

export function deleteWorkout(id) {
  write(WORKOUTS_KEY, read(WORKOUTS_KEY).filter(w => w.id !== id))
}

/** Get previous session's sets for a given day + exercise */
export function getPreviousSets(dayId, exerciseId) {
  const workouts = getWorkouts()
    .filter(w => w.dayId === dayId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  for (const w of workouts) {
    const ex = w.exercises?.find(e => e.exerciseId === exerciseId)
    if (ex?.sets?.length) return ex.sets
  }
  return []
}

// ── Check-ins ──

export function getCheckins() { return read(CHECKINS_KEY) }

export function saveCheckin(entry) {
  const all = read(CHECKINS_KEY)
  all.push({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() })
  write(CHECKINS_KEY, all)
}
