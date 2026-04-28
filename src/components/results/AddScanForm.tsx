'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AddScanForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState(todayISO)
  const [weight, setWeight] = useState('')
  const [smm, setSmm] = useState('')
  const [bfPct, setBfPct] = useState('')
  const [bfMass, setBfMass] = useState('')
  const [notes, setNotes] = useState('')

  function reset() {
    setDate(todayISO())
    setWeight('')
    setSmm('')
    setBfPct('')
    setBfMass('')
    setNotes('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight && !smm && !bfPct && !bfMass) {
      setError('Please enter at least one measurement.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/inbody/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_date: date,
          weight: weight || null,
          smm: smm || null,
          bf_pct: bfPct || null,
          bf_mass: bfMass || null,
          notes: notes || null,
        }),
      })
      if (res.ok) {
        reset()
        setOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors'
  const labelClass = 'block text-[10px] uppercase tracking-wider text-text-secondary mb-1'

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden mb-4">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="px-5 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-text-primary text-sm">Add a Scan</h2>
        <button
          onClick={() => { setOpen(v => !v); if (open) reset() }}
          className="text-xs text-brand hover:text-brand-dark font-medium transition-colors"
        >
          {open ? '✕ Cancel' : '+ Add Scan'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-border-light px-5 pb-5 pt-4 space-y-4 bg-bg-main/40">
          {/* Date */}
          <div>
            <label className={labelClass}>Scan Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Measurements grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input
                type="number" step="0.1" min="0"
                placeholder="e.g. 82.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SMM (kg)</label>
              <input
                type="number" step="0.1" min="0"
                placeholder="e.g. 38.2"
                value={smm}
                onChange={e => setSmm(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Body Fat %</label>
              <input
                type="number" step="0.1" min="0" max="100"
                placeholder="e.g. 18.5"
                value={bfPct}
                onChange={e => setBfPct(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>BF Mass (kg)</label>
              <input
                type="number" step="0.1" min="0"
                placeholder="e.g. 15.2"
                value={bfMass}
                onChange={e => setBfMass(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. post-holiday scan"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Scan'}
          </button>
        </form>
      )}
    </div>
  )
}
