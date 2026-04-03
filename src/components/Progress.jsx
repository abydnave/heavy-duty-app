import { useState, useEffect, useMemo } from 'react'
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
  const [workouts, setWorkouts] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [w, c] = await Promise.all([getWorkouts(), getCheckins()])
      setWorkouts(w)
      setCheckins(c)
      setLoading(false)
    }
    load()
  }, [])

  // Build per-exercise lift history (best set weight per session)
  const liftData = useMemo(() => {
    const map = {}
    for (const w of workouts) {
      for (const ex of (w.exercises || [])) {
        if (!ex.sets?.length) continue
        const best = Math.max(...ex.sets.map(s => s.weight || 0))
        if (!best) continue
        if (!map[ex.exerciseId]) map[ex.exerciseId] = []
        map[ex.exerciseId].push({ date: fmt(w.created_at), weight: best })
      }
    }
    return map
  }, [workouts])

  // Bodyweight trend
  const bwData = useMemo(
    () => checkins.filter(c => c.bodyweight).map(c => ({ date: fmt(c.created_at), bw: c.bodyweight })),
    [checkins],
  )

  // Steps bar
  const stepsData = useMemo(
    () => checkins.filter(c => c.steps).map(c => ({ date: fmt(c.created_at), steps: c.steps })),
    [checkins],
  )

  const hasData = Object.keys(liftData).length > 0 || bwData.length > 0 || stepsData.length > 0

  // Compute next workout day (must be before any early returns — hooks rules)
  const nextWorkout = useMemo(() => {
    if (!workouts.length) return { label: 'Day 1 — Chest + Back', dateStr: 'Start anytime!', dayId: 'day1' }

    const sorted = [...workouts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const last = sorted[0]
    const lastDate = new Date(last.created_at)

    // Figure out which day is next in rotation
    const dayOrder = ['day1', 'day2', 'day3']
    const lastDayIdx = dayOrder.indexOf(last.day_id)
    const nextDayIdx = (lastDayIdx + 1) % 3
    const nextDayId = dayOrder[nextDayIdx]
    const nextDay = programme.find(d => d.id === nextDayId)

    // Rest days: 3 after legs (day2), 2 otherwise
    const restDays = last.day_id === 'day2' ? 3 : 2
    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + restDays)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(nextDate)
    target.setHours(0, 0, 0, 0)

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24))

    let dateStr
    if (diffDays <= 0) dateStr = 'Today!'
    else if (diffDays === 1) dateStr = 'Tomorrow'
    else dateStr = nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return { label: nextDay?.label || nextDayId, dateStr, dayId: nextDayId, isToday: diffDays <= 0 }
  }, [workouts])

  // Build set of workout dates (YYYY-MM-DD strings) for heatmap
  const workoutDates = useMemo(() => {
    const dates = new Set()
    for (const w of workouts) {
      const d = new Date(w.created_at)
      dates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return dates
  }, [workouts])

  // Build heatmap grid: last 13 weeks (91 days)
  const heatmapData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the Monday of the current week
    const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() - mondayOffset)

    // Go back 12 more weeks (13 weeks total)
    const startMonday = new Date(thisMonday)
    startMonday.setDate(thisMonday.getDate() - 12 * 7)

    const weeks = []
    const months = []
    let lastMonth = -1

    for (let w = 0; w < 13; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMonday)
        date.setDate(startMonday.getDate() + w * 7 + d)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const isFuture = date > today
        week.push({ date, dateStr, hasWorkout: workoutDates.has(dateStr), isFuture })

        // Track month labels
        if (d === 0 && date.getMonth() !== lastMonth) {
          months.push({ weekIdx: w, label: date.toLocaleDateString('en-US', { month: 'short' }) })
          lastMonth = date.getMonth()
        }
      }
      weeks.push(week)
    }

    return { weeks, months }
  }, [workoutDates])

  // Compute week streak (consecutive weeks with at least 1 workout)
  const weekStreak = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    let streak = 0
    // Check each week going backwards
    for (let w = 0; w < 52; w++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - mondayOffset - w * 7)
      let hasWorkout = false

      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + d)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        if (workoutDates.has(dateStr)) { hasWorkout = true; break }
      }

      if (hasWorkout) streak++
      else break
    }
    return streak
  }, [workoutDates])

  async function handleDelete(id) {
    await deleteWorkout(id)
    setWorkouts(prev => prev.filter(w => w.id !== id))
    onRefresh?.()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Progress</h2>

      {/* Next Workout Card */}
      <div className="rounded-xl p-4" style={{ background: '#151a25', borderLeft: '4px solid #E8A838' }}>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Next Workout</p>
        <p className="text-sm font-bold text-white">{nextWorkout.label}</p>
        <p className={`text-xs mt-1 font-semibold ${nextWorkout.isToday ? 'text-green-400' : 'text-amber-500'}`}>
          {nextWorkout.isToday ? '🔥 ' : ''}{nextWorkout.dateStr}
        </p>
      </div>

      {/* Week Streak + Heatmap */}
      <div className="rounded-xl p-4" style={{ background: '#151a25' }}>
        {/* Streak */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="text-xl font-extrabold text-white">{weekStreak}</span>
            <span className="text-xs font-semibold text-gray-400 ml-1.5">
              week{weekStreak !== 1 ? 's' : ''} streak
            </span>
          </div>
        </div>

        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 20 }}>
          {heatmapData.months.map((m, i) => (
            <span
              key={i}
              className="text-[9px] text-gray-600"
              style={{
                position: 'relative',
                left: m.weekIdx * 15,
                marginRight: i < heatmapData.months.length - 1
                  ? (heatmapData.months[i + 1].weekIdx - m.weekIdx) * 15 - 20
                  : 0,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1" style={{ width: 14 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div
                key={i}
                className="heatmap-cell flex items-center justify-center text-[8px] text-gray-600"
              >
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {heatmapData.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="heatmap-cell"
                  style={{
                    background: day.isFuture
                      ? '#0d1117'
                      : day.hasWorkout
                        ? '#E8A838'
                        : '#1e2733',
                    opacity: day.isFuture ? 0.3 : 1,
                  }}
                  title={day.isFuture ? '' : `${day.dateStr}${day.hasWorkout ? ' ✓' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

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
            const dayLabel = programme.find(d => d.id === w.day_id)?.label || w.day_id
            return (
              <div key={w.id} className="rounded-xl p-3" style={{ background: '#151a25' }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-white">{dayLabel}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">{fmt(w.created_at)}</span>
                    <button
                      onClick={() => handleDelete(w.id)}
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
