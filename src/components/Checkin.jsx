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
      <h2 className="text-lg font-bold text-white">Daily Check-in</h2>

      <div className="rounded-xl p-4 space-y-4" style={{ background: '#151a25' }}>
        <label className="block">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bodyweight</span>
          <div className="relative mt-1.5">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="0.0"
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              style={{ background: '#1e2433' }}
              value={bodyweight}
              onChange={e => setBodyweight(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">lbs</span>
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Steps</span>
          <div className="relative mt-1.5">
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              style={{ background: '#1e2433' }}
              value={steps}
              onChange={e => setSteps(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">steps</span>
          </div>
        </label>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition"
        style={{ background: saved ? '#4CD964' : '#E8A838' }}
      >
        {saved ? '✓ Saved!' : 'Log Check-in'}
      </button>
    </form>
  )
}
