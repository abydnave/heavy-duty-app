import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { getWorkouts, getCheckins, deleteWorkout } from '../data/storage'
import { programme } from '../data/programme'

const fmt = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function LiftChart({ title, data }) {
  if (!data.length) return null
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <p className="text-sm font-semibold text-slate-300 mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} />
          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Progress({ onRefresh }) {
  const workouts = getWorkouts()
  const checkins = getCheckins()

  // Build per-exercise lift history
  const liftData = useMemo(() => {
    const map = {}
    for (const w of workouts) {
      for (const s of w.sets) {
        if (!s.weight) continue
        if (!map[s.exerciseId]) map[s.exerciseId] = []
        map[s.exerciseId].push({ date: fmt(w.date), weight: s.weight })
      }
    }
    return map
  }, [workouts])

  // Exercise id -> name lookup
  const exNames = useMemo(() => {
    const m = {}
    for (const d of programme) for (const e of d.exercises) m[e.id] = e.name
    return m
  }, [])

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-200">Progress</h2>

      {/* Lift charts */}
      {Object.entries(liftData).length === 0 && (
        <p className="text-sm text-slate-500">No workout data yet. Log a session first.</p>
      )}
      {Object.entries(liftData).map(([exId, data]) => (
        <LiftChart key={exId} title={exNames[exId] || exId} data={data} />
      ))}

      {/* Bodyweight trend */}
      {bwData.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-sm font-semibold text-slate-300 mb-2">Bodyweight Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bwData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={36} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="bw" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Steps bar chart */}
      {stepsData.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-sm font-semibold text-slate-300 mb-2">Daily Steps</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="steps" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session history */}
      {workouts.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-slate-400 pt-2">Session History</h3>
          {[...workouts].reverse().map(w => {
            const dayLabel = programme.find(d => d.id === w.dayId)?.label || w.dayId
            return (
              <div key={w.id} className="bg-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-semibold text-slate-300">{dayLabel}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{fmt(w.date)}</span>
                    <button
                      onClick={() => { deleteWorkout(w.id); onRefresh?.() }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs text-slate-400">
                  <span className="font-medium">Exercise</span>
                  <span className="font-medium text-center">Wt</span>
                  <span className="font-medium text-center">Reps</span>
                  {w.sets.map((s, i) => (
                    <div key={i} className="contents">
                      <span className="text-slate-300 truncate">{exNames[s.exerciseId] || s.exerciseId}</span>
                      <span className="text-center">{s.weight || '-'}</span>
                      <span className="text-center">{s.reps || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
