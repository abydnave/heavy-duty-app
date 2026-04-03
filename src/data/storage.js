const WORKOUTS_KEY = 'hd_workouts'
const CHECKINS_KEY = 'hd_checkins'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] }
  catch { return [] }
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Workouts
export function getWorkouts() { return read(WORKOUTS_KEY) }
export function saveWorkout(entry) {
  // entry: { id, dayId, date, sets: [{ exerciseId, weight, reps, effort }] }
  const all = read(WORKOUTS_KEY)
  all.push({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() })
  write(WORKOUTS_KEY, all)
}
export function deleteWorkout(id) {
  write(WORKOUTS_KEY, read(WORKOUTS_KEY).filter(w => w.id !== id))
}

// Check-ins
export function getCheckins() { return read(CHECKINS_KEY) }
export function saveCheckin(entry) {
  // entry: { bodyweight, steps }
  const all = read(CHECKINS_KEY)
  all.push({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() })
  write(CHECKINS_KEY, all)
}
