'use client'

import { useState } from 'react'
import type { ChallengeCategory, ChallengeMeasurement } from '@/lib/staffhub'

type Props = {
  challengeId: string
  participantId: string
  categories: ChallengeCategory[]
  existingMeasurements: ChallengeMeasurement[]
  startDate: string
  endDate: string
}

// Build week labels between start and end dates
function buildEntryTypes(startDate: string, endDate: string): { key: string; label: string }[] {
  const types: { key: string; label: string }[] = [{ key: 'pre', label: 'Pre' }]
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const diffMs = end.getTime() - start.getTime()
  const weeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  for (let w = 1; w <= weeks; w++) {
    types.push({ key: `week_${w}`, label: `Wk ${w}` })
  }
  types.push({ key: 'post', label: 'Post' })
  return types
}

export default function TrackingGrid({
  challengeId,
  participantId,
  categories,
  existingMeasurements,
  startDate,
  endDate,
}: Props) {
  const entryTypes = buildEntryTypes(startDate, endDate)

  // Build initial values from existing measurements
  const initialValues: Record<string, string> = {}
  for (const m of existingMeasurements) {
    initialValues[`${m.category_id}:${m.entry_type}`] = String(m.value)
  }

  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setValue(categoryId: string, entryType: string, val: string) {
    setValues((prev) => ({ ...prev, [`${categoryId}:${entryType}`]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const measurements: { categoryId: string; entryType: string; value: number }[] = []
    for (const [key, val] of Object.entries(values)) {
      if (val.trim() === '') continue
      const num = parseFloat(val)
      if (isNaN(num)) continue
      const [categoryId, entryType] = key.split(':')
      measurements.push({ categoryId, entryType, value: num })
    }

    if (measurements.length === 0) {
      setSaving(false)
      return
    }

    const res = await fetch(`/api/challenges/${challengeId}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, measurements }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save. Please try again.')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-text-muted italic">
        No tracking categories have been set up for this challenge yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-xl border border-border-light">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-bg-card/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                Metric
              </th>
              {entryTypes.map((et) => (
                <th
                  key={et.key}
                  className="px-3 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap"
                >
                  {et.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr
                key={cat.id}
                className={`border-b border-border-light/50 ${i % 2 === 0 ? '' : 'bg-bg-card/20'}`}
              >
                <td className="px-4 py-2.5 font-medium text-text-primary whitespace-nowrap">
                  {cat.name}
                  {cat.unit && (
                    <span className="ml-1 text-xs text-text-muted">({cat.unit})</span>
                  )}
                </td>
                {entryTypes.map((et) => {
                  const key = `${cat.id}:${et.key}`
                  return (
                    <td key={et.key} className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step="any"
                        value={values[key] ?? ''}
                        onChange={(e) => setValue(cat.id, et.key, e.target.value)}
                        className="w-16 bg-bg-card border border-border-light rounded-lg px-2 py-1 text-center text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        placeholder="—"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand/80 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? 'Saving…' : 'Save my data'}
        </button>
        {saved && (
          <span className="text-sm text-green-400 font-medium">✓ Saved!</span>
        )}
      </div>
    </div>
  )
}
