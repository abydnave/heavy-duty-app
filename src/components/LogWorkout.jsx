import { useState, useEffect } from 'react'
import { programme } from '../data/programme'
import { saveWorkout, getPreviousSets } from '../data/storage'
import RestTimer from './RestTimer'

const ssColors = {
  A: { border: '#E8A838', bg: 'rgba(232,168,56,0.12)', text: '#E8A838' },
  B: { border: '#4CD964', bg: 'rgba(76,217,100,0.12)', text: '#4CD964' },
  C: { border: '#5AC8FA', bg: 'rgba(90,200,250,0.12)', text: '#5AC8FA' },
}

export default function LogWorkout() {
  const [dayIdx, setDayIdx] = useState(0)
  const [exerciseSets, setExerciseSets] = useState(() => initSets(0))
  const [prevData, setPrevData] = useState({})
  const [saved, setSaved] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerExName, setTimerExName] = useState('')

  const day = programme[dayIdx]

  // Load previous session data
  useEffect(() => {
    async function loadPrev() {
      const map = {}
      for (const ex of day.exercises) {
        map[ex.id] = await getPreviousSets(day.id, ex.id)
      }
      setPrevData(map)
    }
    loadPrev()
  }, [day])

  function initSets(idx) {
    const d = programme[idx]
    const map = {}
    for (const ex of d.exercises) {
      map[ex.id] = Array.from({ length: 3 }, () => ({ weight: '', reps: '', completed: false }))
    }
    return map
  }

  function pickDay(idx) {
    setDayIdx(idx)
    setExerciseSets(initSets(idx))
    setSaved(false)
  }

  function updateSet(exId, setIdx, field, value) {
    setExerciseSets(prev => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }))
  }

  function toggleComplete(exId, setIdx) {
    const wasCompleted = exerciseSets[exId]?.[setIdx]?.completed
    setExerciseSets(prev => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, completed: !s.completed } : s),
    }))

    // If checking (not unchecking), maybe start rest timer
    if (!wasCompleted) {
      const ex = day.exercises.find(e => e.id === exId)
      // Skip timer if this exercise has restAfter: false (superset A → go straight to B)
      if (ex?.restAfter === false) return

      // Find next exercise name for display
      const exIdx = day.exercises.findIndex(e => e.id === exId)
      const nextEx = day.exercises[exIdx + 1]
      setTimerExName(nextEx?.name || '')
      setTimerOpen(true)
    }
  }

  function addSet(exId) {
    setExerciseSets(prev => ({
      ...prev,
      [exId]: [...prev[exId], { weight: '', reps: '', completed: false }],
    }))
  }

  function removeSet(exId, setIdx) {
    setExerciseSets(prev => ({
      ...prev,
      [exId]: prev[exId].length > 1 ? prev[exId].filter((_, i) => i !== setIdx) : prev[exId],
    }))
  }

  async function submit() {
    const exercises = day.exercises.map(ex => ({
      exerciseId: ex.id,
      sets: (exerciseSets[ex.id] || []).map(s => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        completed: s.completed,
      })),
    }))
    await saveWorkout({ dayId: day.id, exercises })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setExerciseSets(initSets(dayIdx))
    }, 1500)
  }

  const hasAnySets = day.exercises.some(ex =>
    (exerciseSets[ex.id] || []).some(s => s.weight || s.reps)
  )

  return (
    <div className="space-y-3">
      {/* Day picker */}
      <div className="flex gap-2">
        {programme.map((d, i) => (
          <button
            key={d.id}
            onClick={() => pickDay(i)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition
              ${i === dayIdx
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'}`}
            style={{
              background: i === dayIdx ? '#E8A838' : '#1a1f2e',
            }}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-400 px-1">{day.label}</p>

      {/* Exercise cards */}
      {day.exercises.map(ex => {
        const sets = exerciseSets[ex.id] || []
        const prev = prevData[ex.id] || []
        const ss = ex.superset
        const color = ss ? ssColors[ss] : null

        return (
          <div
            key={ex.id}
            className="rounded-xl overflow-hidden"
            style={{ background: '#151a25' }}
          >
            {/* Exercise header */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color?.border || '#555' }} />
              <span className="text-sm font-bold text-white flex-1">{ex.name}</span>
              {ss && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ borderColor: color?.border, color: color?.text, background: color?.bg }}
                >
                  SS {ss}
                </span>
              )}
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_1fr_1fr_36px] px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Set</span>
              <span>Previous</span>
              <span className="text-center">lbs</span>
              <span className="text-center">Reps</span>
              <span />
            </div>

            {/* Set rows */}
            {sets.map((s, si) => {
              const prevSet = prev[si]
              const prevLabel = prevSet ? `${prevSet.weight} × ${prevSet.reps}` : '—'
              return (
                <div
                  key={si}
                  className={`grid grid-cols-[40px_1fr_1fr_1fr_36px] items-center px-3 py-1.5 gap-1 ${s.completed ? 'set-completed' : ''}`}
                >
                  <span className="text-xs font-bold text-gray-400">{si + 1}</span>
                  <span className="text-xs text-gray-500">{prevLabel}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="—"
                    className="text-center text-sm text-white rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    style={{ background: '#1e2433' }}
                    value={s.weight}
                    onChange={e => updateSet(ex.id, si, 'weight', e.target.value)}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="—"
                    className="text-center text-sm text-white rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    style={{ background: '#1e2433' }}
                    value={s.reps}
                    onChange={e => updateSet(ex.id, si, 'reps', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleComplete(ex.id, si)}
                    className={`check-btn ${s.completed ? 'checked' : ''}`}
                  >
                    {s.completed && (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}

            {/* Add / Remove set */}
            <div className="flex items-center justify-center gap-4 px-3 py-2">
              <button
                type="button"
                onClick={() => addSet(ex.id)}
                className="text-xs font-semibold text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span> Add Set
              </button>
              {sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(ex.id, sets.length - 1)}
                  className="text-xs font-semibold text-gray-600 hover:text-red-400 transition flex items-center gap-1"
                >
                  <span className="text-base leading-none">−</span> Remove
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Finish button */}
      <button
        onClick={submit}
        disabled={!hasAnySets}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition disabled:opacity-40"
        style={{ background: saved ? '#4CD964' : '#E8A838' }}
      >
        {saved ? '✓ Saved!' : 'Finish Workout'}
      </button>

      <div className="h-4" />

      {/* Rest Timer Overlay */}
      <RestTimer
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        exerciseName={timerExName}
      />
    </div>
  )
}
