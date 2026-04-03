import { supabase } from '../lib/supabase'

// ── Workouts ──

export async function getWorkouts() {
  const { data } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: true })
  return data || []
}

export async function saveWorkout(entry) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('workouts').insert({
    user_id: user.id,
    day_id: entry.dayId,
    exercises: entry.exercises,
  })
}

export async function deleteWorkout(id) {
  await supabase.from('workouts').delete().eq('id', id)
}

/** Get previous session's sets for a given day + exercise */
export async function getPreviousSets(dayId, exerciseId) {
  const { data } = await supabase
    .from('workouts')
    .select('exercises')
    .eq('day_id', dayId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data?.length) return []
  const ex = data[0].exercises?.find(e => e.exerciseId === exerciseId)
  return ex?.sets || []
}

// ── Check-ins ──

export async function getCheckins() {
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: true })
  return data || []
}

export async function saveCheckin(entry) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('checkins').insert({
    user_id: user.id,
    bodyweight: entry.bodyweight || null,
    steps: entry.steps || null,
  })
}
