'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StrengthResult } from '@/lib/staffhub'
import InlineDeleteConfirm from "@/components/results/InlineDeleteConfirm";

// ── Exercise definitions ───────────────────────────────────────────────────────

type Exercise = {
  name: string
  unit: string
  higherIsBetter: boolean
  hasNotes: boolean
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
  { name: 'Pull Up 3RM',       unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 15' },
  { name: '9min AMRAP',        unit: 'reps', higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 87', notesPlaceholder: 'Equipment used, e.g. 10 cal bike, 10 wall balls, 10 box jumps' },
  { name: '6min Time Trial',   unit: 'm',    higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 1450', notesPlaceholder: 'Equipment used, e.g. Row erg' },
  { name: 'Watt Bike 6min',    unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 3500' },
  { name: 'Assault Bike 6min', unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 3200' },
  { name: 'Row/Ski 6min',      unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 1800' },
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

function formatDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ── Trend chart ────────────────────────────────────────────────────────────────

interface TrendChartProps {
  results: StrengthResult[]    // newest-first; will be reversed inside
  exercise: Exercise
  pbId: string | undefined
  onDelete?: (id: string) => Promise<void>;
}

function TrendChart({ results, exercise, pbId, onDelete }: TrendChartProps) {
  const sorted = [...results].sort((a, b) => a.tested_date.localeCompare(b.tested_date))
  if (sorted.length < 2) {
    return (
      <p className="text-xs text-text-secondary text-center py-6">
        Need at least 2 results to show a trend.
      </p>
    )
  }

  const W = 320, H = 120, PX = 8, PY = 16
  const pw = W - PX * 2
  const ph = H - PY * 2

  const values = sorted.map(r => r.result_value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const pts = sorted.map((r, i) => {
    const x = PX + (i / (sorted.length - 1)) * pw
    const norm = (r.result_value - minV) / range
    const y = exercise.higherIsBetter
      ? PY + ph - norm * ph
      : PY + norm * ph
    return { x, y, r }
  })

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  // Y-axis labels: min and max
  const topLabel  = exercise.higherIsBetter ? formatValue(maxV, exercise.unit) : formatValue(minV, exercise.unit)
  const botLabel  = exercise.higherIsBetter ? formatValue(minV, exercise.unit) : formatValue(maxV, exercise.unit)

  return (
    <div>
      <div className="flex justify-between text-[10px] text-text-secondary mb-0.5 px-1">
        <span>{topLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => (
          <line
            key={t}
            x1={PX} y1={PY + t * ph} x2={W - PX} y2={PY + t * ph}
            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
            className="text-text-secondary"
          />
        ))}

        {/* Trend line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-brand, #14b8a6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, i) => {
          const isPB = p.r.id === pbId
          return (
            <g key={i}>
              <circle
                cx={p.x} cy={p.y}
                r={isPB ? 5 : 3.5}
                fill={isPB ? 'var(--color-status-green, #22c55e)' : 'var(--color-brand, #14b8a6)'}
                stroke="var(--color-bg-card, #1e2a2a)"
                strokeWidth="1.5"
              />
              {isPB && (
                <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="8" fill="var(--color-status-green, #22c55e)" fontWeight="bold">PB</text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-text-secondary mt-0.5 px-1">
        <span>{botLabel}</span>
      </div>

      {/* X axis dates */}
      <div className="flex justify-between text-[10px] text-text-muted mt-1 px-1">
        <span>{formatDateShort(sorted[0].tested_date)}</span>
        {sorted.length > 2 && <span className="text-center flex-1 text-center">← {sorted.length} tests →</span>}
        <span>{formatDateShort(sorted[sorted.length - 1].tested_date)}</span>
      </div>

      {/* All results table */}
      <div className="mt-4 border border-border-light rounded-xl overflow-hidden">
        <div className="divide-y divide-border-light">
          {[...sorted].reverse().map((r, i) => {
            const isPB = r.id === pbId
            return (
              <div key={r.id} className={`flex items-center justify-between px-4 py-2 ${i === 0 ? 'bg-bg-main' : ''}`}>
                <span className="text-xs text-text-secondary">{formatDate(r.tested_date)}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {isPB && results.length > 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold">PB</span>
                    )}
                    <span className={`font-data text-sm font-semibold ${i === 0 ? 'text-brand' : 'text-text-primary'}`}>
                      {formatValue(r.result_value, exercise.unit)}
                    </span>
                  </div>
                  {onDelete && (
                    <InlineDeleteConfirm onConfirm={() => onDelete(r.id)} className="ml-2 shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Per-exercise card ──────────────────────────────────────────────────────────

interface CardProps {
  exercise: Exercise
  results: StrengthResult[]   // newest first, pre-filtered for this exercise
  isLoggedIn: boolean
}

function ExerciseCard({ exercise, results, isLoggedIn }: CardProps) {
  const router = useRouter()
  const [view, setView] = useState<'data' | 'trend' | 'form'>('data')
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
        setView('data')
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

  async function handleDeleteResult(id: string) {
    const res = await fetch("/api/strength", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Delete failed");
    router.refresh();
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

        {/* Mini history strip — only in data view */}
        {view === 'data' && results.length > 0 && (
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

        {/* Editable history — lets a member remove a wrong entry without needing a trend */}
        {view === 'data' && isLoggedIn && results.length > 0 && (
          <div className="border-t border-border-light pt-3 mb-3 space-y-1 max-h-44 overflow-y-auto">
            {[...results].map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{formatDate(r.tested_date)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-data font-semibold text-text-primary">
                    {formatValue(r.result_value, exercise.unit)}
                  </span>
                  <InlineDeleteConfirm onConfirm={() => handleDeleteResult(r.id)} className="shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes display for AMRAP/Time Trial */}
        {view === 'data' && latest?.result_notes && (
          <p className="text-[11px] text-text-secondary bg-bg-main rounded-lg px-3 py-1.5 mb-3 italic">
            📋 {latest.result_notes}
          </p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-3 border-t border-border-light pt-3">
          {isLoggedIn && (
            <button
              onClick={() => setView(v => v === 'form' ? 'data' : 'form')}
              className="text-xs text-brand hover:text-brand-dark font-medium transition-colors"
            >
              {view === 'form' ? '✕ Cancel' : '+ Add Result'}
            </button>
          )}
          {results.length >= 2 && (
            <button
              onClick={() => setView(v => v === 'trend' ? 'data' : 'trend')}
              className={`text-xs font-medium transition-colors flex items-center gap-1 ${
                view === 'trend' ? 'text-brand' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {view === 'trend' ? 'Hide trend' : 'Trend'}
            </button>
          )}
        </div>
      </div>

      {/* Trend chart panel */}
      {view === 'trend' && (
        <div className="border-t border-border-light px-5 pb-5 pt-4 bg-bg-main/40">
          <TrendChart results={results} exercise={exercise} pbId={pb?.id} onDelete={isLoggedIn ? handleDeleteResult : undefined} />
        </div>
      )}

      {/* Inline add-result form */}
      {view === 'form' && (
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
