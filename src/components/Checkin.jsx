import { useState } from 'react'
import { saveCheckin } from '../data/storage'

export default function Checkin() {
  const [bodyweight, setBodyweight] = useState('')
  const [steps, setSteps] = useState('')
  const [saved, setSaved] = useState(false)

  function submit(e) {
    e.preventDefault()
    saveCheckin({
      bodyweight: Number(bodyweight) || 0,
      steps: Number(steps) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setBodyweight('')
    setSteps('')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-200">Daily Check-in</h2>

      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <label className="block text-sm text-slate-400">
          Bodyweight (lbs)
          <input
            type="number" inputMode="decimal" step="0.1"
            placeholder="e.g. 185"
            className="mt-1 w-full bg-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={bodyweight} onChange={e => setBodyweight(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Steps
          <input
            type="number" inputMode="numeric"
            placeholder="e.g. 8000"
            className="mt-1 w-full bg-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={steps} onChange={e => setSteps(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition"
      >
        {saved ? 'Saved!' : 'Log Check-in'}
      </button>
    </form>
  )
}
