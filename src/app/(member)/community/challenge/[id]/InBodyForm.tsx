'use client'

import { useState } from 'react'

type InBodyData = {
  pre_weight_kg: number | null
  pre_body_fat_pct: number | null
  pre_fat_mass_kg: number | null
  pre_smm_kg: number | null
  post_weight_kg: number | null
  post_body_fat_pct: number | null
  post_fat_mass_kg: number | null
  post_smm_kg: number | null
}

type Props = {
  challengeId: string
  participantId: string
  existing: InBodyData
}

const FIELDS: { key: keyof InBodyData; label: string; unit: string }[] = [
  { key: 'pre_weight_kg', label: 'Weight', unit: 'kg' },
  { key: 'pre_body_fat_pct', label: 'Body Fat', unit: '%' },
  { key: 'pre_fat_mass_kg', label: 'Fat Mass', unit: 'kg' },
  { key: 'pre_smm_kg', label: 'Muscle (SMM)', unit: 'kg' },
]

export default function InBodyForm({ challengeId, participantId, existing }: Props) {
  const [preWeight, setPreWeight] = useState(existing.pre_weight_kg?.toString() ?? '')
  const [preBf, setPreBf] = useState(existing.pre_body_fat_pct?.toString() ?? '')
  const [preFat, setPreFat] = useState(existing.pre_fat_mass_kg?.toString() ?? '')
  const [preSmm, setPreSmm] = useState(existing.pre_smm_kg?.toString() ?? '')
  const [postWeight, setPostWeight] = useState(existing.post_weight_kg?.toString() ?? '')
  const [postBf, setPostBf] = useState(existing.post_body_fat_pct?.toString() ?? '')
  const [postFat, setPostFat] = useState(existing.post_fat_mass_kg?.toString() ?? '')
  const [postSmm, setPostSmm] = useState(existing.post_smm_kg?.toString() ?? '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch(`/api/challenges/${challengeId}/inbody`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        pre_weight_kg: preWeight || null,
        pre_bf_pct: preBf || null,
        pre_fat_mass_kg: preFat || null,
        pre_smm_kg: preSmm || null,
        post_weight_kg: postWeight || null,
        post_bf_pct: postBf || null,
        post_fat_mass_kg: postFat || null,
        post_smm_kg: postSmm || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save. Please try again.')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  const inputClass =
    'w-full bg-bg-base border border-border-light rounded-xl px-3 py-2 text-center text-sm text-text-primary focus:outline-none focus:border-brand transition-colors'

  function Row({
    label, unit, preVal, setPreVal, postVal, setPostVal
  }: {
    label: string; unit: string
    preVal: string; setPreVal: (v: string) => void
    postVal: string; setPostVal: (v: string) => void
  }) {
    return (
      <tr className="border-b border-border-light/50">
        <td className="py-2 pr-4 text-sm font-medium text-text-primary whitespace-nowrap">
          {label} <span className="text-xs text-text-muted">({unit})</span>
        </td>
        <td className="py-1.5 px-2">
          <input
            type="number" step="any" value={preVal}
            onChange={(e) => { setPreVal(e.target.value); setSaved(false) }}
            placeholder="—" className={inputClass}
          />
        </td>
        <td className="py-1.5 px-2">
          <input
            type="number" step="any" value={postVal}
            onChange={(e) => { setPostVal(e.target.value); setSaved(false) }}
            placeholder="—" className={inputClass}
          />
        </td>
        <td className="py-1.5 pl-2 text-center">
          {preVal && postVal ? (
            (() => {
              const diff = parseFloat(postVal) - parseFloat(preVal)
              if (isNaN(diff)) return null
              const colour = diff < 0
                ? (label === 'Muscle (SMM)' ? 'text-red-400' : 'text-green-400')
                : (label === 'Muscle (SMM)' ? 'text-green-400' : 'text-red-400')
              return (
                <span className={`text-xs font-semibold ${colour}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              )
            })()
          ) : null}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border-light">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-bg-card/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Metric</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wide w-24">Pre</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wide w-24">Post</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wide w-16">Δ</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Weight" unit="kg" preVal={preWeight} setPreVal={setPreWeight} postVal={postWeight} setPostVal={setPostWeight} />
            <Row label="Body Fat" unit="%" preVal={preBf} setPreVal={setPreBf} postVal={postBf} setPostVal={setPostBf} />
            <Row label="Fat Mass" unit="kg" preVal={preFat} setPreVal={setPreFat} postVal={postFat} setPostVal={setPostFat} />
            <Row label="Muscle (SMM)" unit="kg" preVal={preSmm} setPreVal={setPreSmm} postVal={postSmm} setPostVal={setPostSmm} />
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-text-muted">
        These values come from your InBody body composition scan. Your coach will update these after each scan — you can also enter them yourself if you have the printout.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand/80 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? 'Saving…' : 'Save InBody scores'}
        </button>
        {saved && <span className="text-sm text-green-400 font-medium">✓ Saved!</span>}
      </div>
    </div>
  )
}
