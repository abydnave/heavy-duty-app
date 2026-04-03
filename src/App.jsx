import { useState, useCallback } from 'react'
import LogWorkout from './components/LogWorkout'
import Checkin from './components/Checkin'
import Progress from './components/Progress'

const tabs = [
  { id: 'log',      label: 'Log Workout', icon: '🏋️' },
  { id: 'checkin',  label: 'Check-in',    icon: '📋' },
  { id: 'progress', label: 'Progress',    icon: '📈' },
]

export default function App() {
  const [tab, setTab] = useState('log')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Heavy Duty Tracker
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-24 overflow-y-auto">
        {tab === 'log'      && <LogWorkout />}
        {tab === 'checkin'  && <Checkin />}
        {tab === 'progress' && <Progress key={tick} onRefresh={refresh} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-800 border-t border-slate-700 flex safe-bottom">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition
              ${t.id === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
