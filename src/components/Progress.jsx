import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { getWorkouts, getCheckins, deleteWorkout } from '../data/storage'
import { programme } from '../data/programme'

const fmt = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const chartTooltipStyle = {
  background: '#1a1f2e',
  border: '1px solid #2a3040',
  borderRadius: 10,
  fontSize: 12,
  color: '#fff',
}

// Exercise id -> name lookup
const exNames = (() => {
  const m = {}
  for (const d of programme) for (const e of d.exercises) m[e.id] = e.name
  return m
})()

function LiftChart({ title, data }) {
  if (!data.length) return null
  return (
    <div className="rounded-xl p-3" style={{ background: '#151a25' }}>
      <p className="text-sm font-bold text-gray-300 mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} />
          <YAxis tick={{ fontSize: 10, fill: '#555' }} width={36} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Line type="monotone" dataKey="weight" stroke="#E8A838" strokeWidth={2} dot={{ r: 3, fill: '#E8A838' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Progress({ onRefresh }) {
  const workouts = getWorkouts()
  const checkins = getCheckins()

  // Build per-exercise lift history (best set weight per session)
  const liftData = useMemo(() => {
    const map = {}
    for (const w of workouts) {
      for (const ex of (w.exercises || [])) {
        if (!ex.sets?.length) continue
        const best = Math.max(...ex.sets.map(s => s.weight || 0))
        if (!best) continue
        if (!map[ex.exerciseId]) map[ex.exerciseId] = []
        map[ex.exerciseId].push({ date: fmt(w.date), weight: best })
      }
    }
    return map
  }, [workouts])

  // Bodyweight trend
  const bwData = useMemo(
    () => checkins.filter(c => c.bodyweight).map(c => ({ date: fmt(c.date), bw: c.bodyweight })),
    [checkins],
  )

  // Steps bar
  const stepsData = useMemo(
    () => checkins.filter(c => c.steps).map(c => ({ date: fmt(c.date), steps: c.steps })),
    [checkins],
  )

  const hasData = Object.keys(liftData).length > 0 || bwData.length > 0 || stepsData.length > 0

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Progress</h2>

      {!hasData && (
        <div className="rounded-xl p-8 text-center" style={{ background: '#151a25' }}>
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-gray-500">No data yet. Log a workout or check-in to see your progress.</p>
        </div>
      )}

      {/* Lift charts */}
      {Object.entries(liftData).map(([exId, data]) => (
        <LiftChart key={exId} title={exNames[exId] || exId} data={data} />
      ))}

      {/* Bodyweight trend */}
      {bwData.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: '#151a25' }}>
          <p className="text-sm font-bold text-gray-300 mb-2">Bodyweight</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={bwData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} />
              <YAxis tick={{ fontSize: 10, fill: '#555' }} width={36} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="bw" stroke="#4CD964" strokeWidth={2} dot={{ r: 3, fill: '#4CD964' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Steps bar chart */}
      {stepsData.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: '#151a25' }}>
          <p className="text-sm font-bold text-gray-300 mb-2">Daily Steps</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={stepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} />
              <YAxis tick={{ fontSize: 10, fill: '#555' }} width={40} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="steps" fill="#E8A838" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session history */}
      {workouts.length > 0 && (
        <>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-2">Session History</h3>
          {[...workouts].reverse().map(w => {
            const dayLabel = programme.find(d => d.id === w.dayId)?.label || w.dayId
            return (
              <div key={w.id} className="rounded-xl p-3" style={{ background: '#151a25' }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-white">{dayLabel}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">{fmt(w.date)}</span>
                    <button
                      onClick={() => { deleteWorkout(w.id); onRefresh?.() }}
                      className="text-[10px] text-red-500 hover:text-red-400 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {(w.exercises || []).map(ex => (
                  <div key={ex.exerciseId} className="mb-2">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">{exNames[ex.exerciseId] || ex.exerciseId}</p>
                    <div className="flex flex-wrap gap-2">
                      {ex.sets.map((s, si) => (
                        <span key={si} className="text-[11px] text-gray-500">
                          {s.weight} lbs × {s.reps}
                          {s.completed && <span className="text-green-500 ml-0.5">✓</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}

      <div className="h-4" />
    </div>
  )
}
