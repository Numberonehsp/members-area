'use client'

import { useState } from 'react'
import type { NutritionLog } from '@/types/nutrition'

type Props = {
  currentLog: NutritionLog | null
  date: string
  onSaved: (log: NutritionLog) => void
  onClose: () => void
}

type Fields = { calories: string; protein_g: string; carbs_g: string; fats_g: string }

export default function LogModal({ currentLog, date, onSaved, onClose }: Props) {
  const [fields, setFields] = useState<Fields>({
    calories:  String(currentLog?.calories  ?? ''),
    protein_g: String(currentLog?.protein_g ?? ''),
    carbs_g:   String(currentLog?.carbs_g   ?? ''),
    fats_g:    String(currentLog?.fats_g    ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    const calories  = parseInt(fields.calories)
    const protein_g = parseInt(fields.protein_g)
    const carbs_g   = parseInt(fields.carbs_g)
    const fats_g    = parseInt(fields.fats_g)

    if (isNaN(calories) || isNaN(protein_g) || isNaN(carbs_g) || isNaN(fats_g)) {
      setError('Please fill in all four fields with numbers.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, calories, protein_g, carbs_g, fats_g }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onSaved(data.log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputFields: { key: keyof Fields; label: string; placeholder: string }[] = [
    { key: 'calories',  label: 'Calories (kcal)', placeholder: 'e.g. 1800' },
    { key: 'protein_g', label: 'Protein (g)',      placeholder: 'e.g. 150'  },
    { key: 'carbs_g',   label: 'Carbs (g)',        placeholder: 'e.g. 200'  },
    { key: 'fats_g',    label: 'Fats (g)',         placeholder: 'e.g. 65'   },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-border-light rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-text-primary">Log Today</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">×</button>
          </div>

          <div className="space-y-3 mb-5">
            {inputFields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-text-secondary mb-1">{label}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={fields[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-bg-main border border-border-light rounded-xl px-4 py-3 text-text-primary text-base focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
