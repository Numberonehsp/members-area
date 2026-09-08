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

const inputClass =
  'w-full h-14 bg-bg-base border border-border-light rounded-xl px-4 text-lg text-center tabular-nums text-text-primary ' +
  'focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors'

// A metric row is a plain function that returns markup, not a component. Defining
// a component inside InBodyForm would give it a new identity on every keystroke,
// so React would remount the <input>, drop focus, and close the mobile keyboard.
function metricRow(args: {
  id: string
  label: string
  unit: string
  preVal: string
  postVal: string
  onPre: (v: string) => void
  onPost: (v: string) => void
}) {
  const { id, label, unit, preVal, postVal, onPre, onPost } = args

  let delta: { text: string; colour: string } | null = null
  if (preVal && postVal) {
    const diff = parseFloat(postVal) - parseFloat(preVal)
    if (!isNaN(diff)) {
      const good = label === 'Muscle (SMM)' ? diff > 0 : diff < 0
      delta = {
        text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`,
        colour: good ? 'text-green-400' : 'text-red-400',
      }
    }
  }

  return (
    <div key={id} className="rounded-xl border border-border-light bg-bg-card/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-text-primary">
          {label} <span className="text-xs font-normal text-text-muted">({unit})</span>
        </span>
        {delta && (
          <span className={`text-xs font-semibold ${delta.colour}`}>{delta.text}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${id}-pre`}
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted"
          >
            Pre
          </label>
          <input
            id={`${id}-pre`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={preVal}
            onChange={(e) => onPre(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-post`}
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted"
          >
            Post
          </label>
          <input
            id={`${id}-post`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={postVal}
            onChange={(e) => onPost(e.target.value)}
            placeholder="—"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

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

  const bind = (set: (v: string) => void) => (v: string) => {
    set(v)
    setSaved(false)
  }

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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {metricRow({
          id: 'weight', label: 'Weight', unit: 'kg',
          preVal: preWeight, postVal: postWeight,
          onPre: bind(setPreWeight), onPost: bind(setPostWeight),
        })}
        {metricRow({
          id: 'bodyfat', label: 'Body Fat', unit: '%',
          preVal: preBf, postVal: postBf,
          onPre: bind(setPreBf), onPost: bind(setPostBf),
        })}
        {metricRow({
          id: 'fatmass', label: 'Fat Mass', unit: 'kg',
          preVal: preFat, postVal: postFat,
          onPre: bind(setPreFat), onPost: bind(setPostFat),
        })}
        {metricRow({
          id: 'smm', label: 'Muscle (SMM)', unit: 'kg',
          preVal: preSmm, postVal: postSmm,
          onPre: bind(setPreSmm), onPost: bind(setPostSmm),
        })}
      </div>

      <p className="text-[11px] text-text-muted">
        These values come from your InBody body composition scan. Your coach will update these after each scan — you can also enter them yourself if you have the printout.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand/80 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? 'Saving…' : 'Save InBody scores'}
        </button>
        {saved && <span className="text-sm text-green-400 font-medium">✓ Saved!</span>}
      </div>
    </div>
  )
}
