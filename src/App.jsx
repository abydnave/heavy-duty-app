import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import LogWorkout from './components/LogWorkout'
import Checkin from './components/Checkin'
import Progress from './components/Progress'

/* ── SVG Icons ── */
const DumbbellIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'text-amber-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M3 10V7a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3M21 10V7a1 1 0 0 0-1-1h-1.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1v-3M9.5 6v12M14.5 6v12"/>
  </svg>
)

const ClipboardIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'text-amber-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>
  </svg>
)

const ChartIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'text-amber-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>
)

const tabs = [
  { id: 'log',      label: 'Workout', Icon: DumbbellIcon },
  { id: 'checkin',  label: 'Check-in', Icon: ClipboardIcon },
  { id: 'progress', label: 'Progress', Icon: ChartIcon },
]

function AppShell() {
  const { user } = useAuth()
  const [tab, setTab] = useState('log')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  if (!user) return <Login />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Heavy Duty
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-[10px] text-gray-600 hover:text-gray-400 font-semibold"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-24 overflow-y-auto">
        {tab === 'log'      && <LogWorkout />}
        {tab === 'checkin'  && <Checkin />}
        {tab === 'progress' && <Progress key={tick} onRefresh={refresh} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 flex safe-bottom border-t" style={{ background: '#0d1117', borderColor: '#1e2733' }}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center py-2 transition"
          >
            <Icon active={id === tab} />
            <span className={`text-[10px] mt-0.5 font-medium ${id === tab ? 'text-amber-500' : 'text-gray-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
