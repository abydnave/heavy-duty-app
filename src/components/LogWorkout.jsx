import { useState } from 'react'
import { programme } from '../data/programme'
import { saveWorkout } from '../data/storage'

const ssColors = {
  A: 'border-l-indigo-500',
  B: 'border-l-emerald-500',
  C: 'border-l-amber-500',
}

export default function LogWorkout() {
  const [dayIdx, setDayIdx] = useState(0)
  const [sets, setSets] = useState(() => initSets(0))
  const [saved, setSaved] = useState(false)

  function initSets(idx) {
    return programme[idx].exercises.map(ex => ({
      exerciseId: ex.id,
      weight: '',
      reps: '',
      effort: '',
    }))
  }

  function pickDay(idx) {
    setDayIdx(idx)
    setSets(initSets(idx))
    setSaved(false)
  }

  function update(i, field, value) {
    setSets(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s))
  }

  function submit(e) {
    e.preventDefault()
    saveWorkout({
      dayId: programme[dayIdx].id,
      sets: sets.map(s => ({
        ...s,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        effort: Number(s.effort) || 0,
      })),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSets(initSets(dayIdx))
  }

  const day = programme[dayIdx]

  return (
    <div className="space-y-4">
      {/* Day picker */}
      <div className="flex gap-2">
        {programme.map((d, i) => (
          <button
            key={d.id}
            onClick={() => pickDay(i)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
              ${i === dayIdx
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-bold text-slate-200">{day.label}</h2>

      <form onSubmit={submit} className="space-y-3">
        {day.exercises.map((ex, i) => {
          const ss = ex.superset
          const border = ss ? `border-l-4 ${ssColors[ss] || 'border-l-slate-600'}` : ''
          return (
            <div key={ex.id} className={`bg-slate-800 rounded-lg p-3 space-y-2 ${border}`}>
              <div className="flex items-center gap-2">
                {ss && (
                  <span className="text-[10px] font-bold bg-slate-700 rounded px-1.5 py-0.5 text-slate-400">
                    SS {ss}
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-300">{ex.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number" inputMode="decimal" placeholder="Weight"
                  className="bg-slate-700 rounded px-2 py-1.5 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sets[i].weight} onChange={e => update(i, 'weight', e.target.value)}
                />
                <input
                  type="number" inputMode="numeric" placeholder="Reps"
                  className="bg-slate-700 rounded px-2 py-1.5 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sets[i].reps} onChange={e => update(i, 'reps', e.target.value)}
                />
                <input
                  type="number" inputMode="numeric" placeholder="RPE"
                  min="1" max="10"
                  className="bg-slate-700 rounded px-2 py-1.5 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sets[i].effort} onChange={e => update(i, 'effort', e.target.value)}
                />
              </div>
            </div>
          )
        })}

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition"
        >
          {saved ? 'Saved!' : 'Save Workout'}
        </button>
      </form>
    </div>
  )
}
