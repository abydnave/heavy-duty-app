import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_REST = 150 // 2:30 in seconds

export default function RestTimer({ isOpen, onClose, exerciseName }) {
  const [seconds, setSeconds] = useState(DEFAULT_REST)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Start timer when opened
  useEffect(() => {
    if (isOpen) {
      setSeconds(DEFAULT_REST)
      setRunning(true)
    } else {
      setRunning(false)
      setSeconds(DEFAULT_REST)
    }
  }, [isOpen])

  // Countdown logic
  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            playBeep()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Play beep using Web Audio API (works on mobile)
  const playBeep = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx

      // Three short beeps
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.value = 0.3
        osc.start(ctx.currentTime + i * 0.2)
        osc.stop(ctx.currentTime + i * 0.2 + 0.15)
      }
    } catch (e) {
      // Audio not available, vibrate instead
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
    }
  }, [])

  function addTime(s) {
    setSeconds(prev => prev + s)
    if (!running) setRunning(true)
  }

  function skip() {
    setRunning(false)
    onClose()
  }

  function togglePause() {
    setRunning(prev => !prev)
  }

  if (!isOpen) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = seconds / DEFAULT_REST
  const circumference = 2 * Math.PI * 54 // radius 54
  const dashOffset = circumference * (1 - progress)
  const isFinished = seconds === 0

  return (
    <div className="rest-timer-overlay">
      <div className="rest-timer-card">
        {/* Header */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rest Timer</p>
        {exerciseName && (
          <p className="text-[11px] text-gray-600 mb-4">Next up after rest</p>
        )}

        {/* Circular countdown */}
        <div className="relative w-32 h-32 mx-auto mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e2733" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={isFinished ? '#4CD964' : '#E8A838'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="rest-timer-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold tabular-nums ${isFinished ? 'text-green-400' : 'text-white'}`}>
              {isFinished ? 'GO!' : `${mins}:${secs.toString().padStart(2, '0')}`}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={() => addTime(-15)}
            disabled={seconds <= 15}
            className="rest-timer-btn text-gray-400"
          >
            -15s
          </button>
          <button
            onClick={togglePause}
            className="rest-timer-btn-main"
            style={{ background: running ? '#2a3040' : '#E8A838' }}
          >
            {running ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => addTime(15)}
            className="rest-timer-btn text-gray-400"
          >
            +15s
          </button>
        </div>

        {/* Skip button */}
        <button
          onClick={skip}
          className="text-xs font-semibold text-gray-500 hover:text-white transition"
        >
          {isFinished ? 'Dismiss' : 'Skip Rest'}
        </button>
      </div>
    </div>
  )
}
