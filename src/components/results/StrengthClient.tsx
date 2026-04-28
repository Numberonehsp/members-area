'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StrengthResult } from '@/lib/staffhub'

// ── Exercise definitions ───────────────────────────────────────────────────────

type Exercise = {
  name: string
  unit: string
  higherIsBetter: boolean
  hasNotes: boolean        // AMRAP + Time Trial need equipment notes
  notesPlaceholder?: string
  placeholder: string
}

const EXERCISES: Exercise[] = [
  { name: 'Hex Deadlift 3RM',  unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 140' },
  { name: 'Back Squat 3RM',    unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 100' },
  { name: 'Bench Press 3RM',   unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 80' },
  { name: 'Clean & Jerk 1RM',  unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 70' },
  { name: 'Snatch 1RM',        unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 55' },
  { name: 'Pull Up Max Reps',  unit: 'reps', higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 12' },
  { name: '9min AMRAP',        unit: 'reps', higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 87', notesPlaceholder: 'Equipment used, e.g. 10 cal bike, 10 wall balls, 10 box jumps' },
  { name: '6min Time Trial',   unit: 'm',    higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 1450', notesPlaceholder: 'Equipment used, e.g. Row erg' },
  { name: '5km Run',           unit: 'min',  higherIsBetter: false, hasNotes: false, placeholder: 'e.g. 24.5 (decimal minutes)' },
  { name: '10km Run',          unit: 'min',  higherIsBetter: false, hasNotes: false, placeholder: 'e.g. 52.0 (decimal minutes)' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatValue(value: number, unit: string): string {
  if (unit === 'min') {
    const totalSec = Math.round(value * 60)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
  if (unit === 'reps' || unit === 'm') return `${Math.round(value)}${unit}`
  return `${value % 1 === 0 ? value : value.toFixed(1)}${unit}`
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ── Per-exercise card ──────────────────────────────────────────────────────────

interface CardProps {
  exercise: Exercise
  results: StrengthResult[]   // newest first, pre-filtered for this exercise
  isLoggedIn: boolean
}

function ExerciseCard({ exercise, results, isLoggedIn }: CardProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latest = results[0] ?? null
  const pb = results.length > 0
    ? exercise.higherIsBetter
      ? results.reduce((best, r) => r.result_value > best.result_value ? r : best)
      : results.reduce((best, r) => r.result_value < best.result_value ? r : best)
    : null

  const isLatestPB = latest && pb && latest.id === pb.id && results.length > 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise: exercise.name,
          result_value: parseFloat(value),
          result_notes: notes || null,
          tested_date: date,
        }),
      })
      if (res.ok) {
        setValue('')
        setNotes('')
        setDate(todayISO())
        setShowForm(false)
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

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      {/* Main info row */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text-primary text-sm">{exercise.name}</h3>
            <p className="text-xs text-text-secondary">{exercise.unit}</p>
          </div>
          <div className="text-right">
            {latest ? (
              <>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-display text-2xl text-text-primary leading-none">
                    {formatValue(latest.result_value, exercise.unit)}
                  </span>
                  {isLatestPB && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold">
                      🏆 PB
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">{formatDate(latest.tested_date)}</p>
              </>
            ) : (
              <span className="text-xs text-text-secondary italic">No results yet</span>
            )}
          </div>
        </div>

        {/* History row */}
        {results.length > 0 && (
          <div className="flex gap-2 border-t border-border-light pt-3 mb-3 overflow-x-auto">
            {[...results].reverse().slice(-5).map((r, i, arr) => {
              const isLatestInRow = i === arr.length - 1
              const isPBRow = r.id === pb?.id
              return (
                <div key={r.id} className="flex-1 min-w-[60px] text-center">
                  <p className="text-[10px] text-text-secondary mb-0.5 whitespace-nowrap">
                    {formatDate(r.tested_date).split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p className={`font-data text-xs font-semibold ${isLatestInRow ? 'text-brand' : 'text-text-secondary'}`}>
                    {formatValue(r.result_value, exercise.unit)}
                  </p>
                  {isPBRow && results.length > 1 && (
                    <p className="text-[9px] text-status-green">PB</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Notes display for AMRAP/Time Trial */}
        {latest?.result_notes && (
          <p className="text-[11px] text-text-secondary bg-bg-main rounded-lg px-3 py-1.5 mb-3 italic">
            📋 {latest.result_notes}
          </p>
        )}

        {/* Add result button */}
        {isLoggedIn && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-xs text-brand hover:text-brand-dark font-medium transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add Result'}
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-t border-border-light px-5 pb-5 pt-4 space-y-3 bg-bg-main/40">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                Result ({exercise.unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder={exercise.placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {exercise.hasNotes && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                Equipment / Notes
              </label>
              <input
                type="text"
                placeholder={exercise.notesPlaceholder}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || !value}
            className="bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Result'}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

interface Props {
  results: StrengthResult[]
  isLoggedIn: boolean
}

export default function StrengthClient({ results, isLoggedIn }: Props) {
  const totalTests = EXERCISES.filter(ex =>
    results.some(r => r.exercise === ex.name)
  ).length

  const pbCount = EXERCISES.filter(ex => {
    const exResults = results.filter(r => r.exercise === ex.name)
    if (exResults.length < 2) return false
    const latest = exResults[0]
    const pb = ex.higherIsBetter
      ? exResults.reduce((b, r) => r.result_value > b.result_value ? r : b)
      : exResults.reduce((b, r) => r.result_value < b.result_value ? r : b)
    return latest.id === pb.id
  }).length

  return (
    <>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Exercises', value: EXERCISES.length },
          { label: 'Results recorded', value: totalTests, colour: totalTests > 0 ? 'text-brand' : '' },
          { label: 'Current PBs', value: pbCount, colour: pbCount > 0 ? 'text-status-green' : '' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm text-center">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className={`font-display text-3xl leading-none mb-1 ${s.colour || 'text-text-primary'}`}>{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-text-secondary mb-4 text-center">Log in to record your results.</p>
      )}

      {/* Exercise grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXERCISES.map(exercise => (
          <ExerciseCard
            key={exercise.name}
            exercise={exercise}
            results={results.filter(r => r.exercise === exercise.name)}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </>
  )
}
