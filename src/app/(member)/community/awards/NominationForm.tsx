'use client'

import { useState } from 'react'

export default function NominationForm() {
  const [nomineeName, setNomineeName] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nomineeName.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomineeName: nomineeName.trim(), reason: reason.trim() }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
    setSaving(false)
  }

  if (submitted) {
    return (
      <div className="bg-status-amber/10 border border-status-amber/20 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">🏆</div>
        <p className="font-display font-bold text-text-primary mb-1">Nomination submitted!</p>
        <p className="text-sm text-text-secondary">
          Thanks for recognising your fellow member. The coaches will review nominations at the end of the month.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border-light rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Nominate a Member
        </p>
        <h3 className="font-display font-bold text-text-primary">Athlete of the Month</h3>
        <p className="text-xs text-text-muted mt-1">
          Know someone who has trained hard or made a big step forward this month? Nominate them!
        </p>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Member name <span className="text-brand">*</span></label>
        <input
          type="text"
          value={nomineeName}
          onChange={(e) => setNomineeName(e.target.value)}
          placeholder="e.g. Sarah Johnson"
          required
          className="w-full bg-bg-base border border-border-light rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Tell us why they deserve it…"
          className="w-full bg-bg-base border border-border-light rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving || !nomineeName.trim()}
        className="w-full bg-brand hover:bg-brand/80 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        {saving ? 'Submitting…' : '🏆 Submit Nomination'}
      </button>
    </form>
  )
}
