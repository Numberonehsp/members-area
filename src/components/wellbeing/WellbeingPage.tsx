'use client'

import { useState } from 'react'

type Checkin = {
  id: string
  week_start: string
  energy: number
  sleep: number
  stress: number
  comments: string | null
}

type Props = { checkins: Checkin[] }

const METRICS: { key: MetricKey; label: string; icon: string; colour: string; textColour: string; invert?: boolean }[] = [
  { key: 'energy', label: 'Energy',      icon: '⚡', colour: 'bg-brand',         textColour: 'text-brand'         },
  { key: 'sleep',  label: 'Sleep',        icon: '🌙', colour: 'bg-blue-500',      textColour: 'text-blue-600'      },
  { key: 'stress', label: 'Stress',       icon: '🧘', colour: 'bg-status-amber',  textColour: 'text-status-amber', invert: true },
]

type MetricKey = 'energy' | 'sleep' | 'stress'

const RATING_LABELS: Record<MetricKey, string[]> = {
  energy: ['Exhausted', 'Low', 'OK', 'Good', 'Great'],
  sleep:  ['Terrible', 'Poor', 'OK', 'Good', 'Excellent'],
  stress: ['None', 'Mild', 'Moderate', 'High', 'Very high'],
}

function getISOWeekMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeek(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function colourForValue(value: number, invert = false) {
  if (invert) {
    if (value <= 2) return 'text-brand'
    if (value === 3) return 'text-status-amber'
    return 'text-status-red'
  }
  if (value >= 4) return 'text-brand'
  if (value === 3) return 'text-status-amber'
  return 'text-status-red'
}

export default function WellbeingPage({ checkins }: Props) {
  const thisWeek = getISOWeekMonday(new Date())
  const hasThisWeek = checkins.some(c => c.week_start === thisWeek)

  const [form, setForm] = useState({ energy: 0, sleep: 0, stress: 0, comments: '' })
  const [submitted, setSubmitted] = useState(hasThisWeek)
  const [showForm, setShowForm] = useState(!hasThisWeek)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!form.energy || !form.sleep || !form.stress) return
    setSaving(true)
    setSaveError(null)

    const res = await fetch('/api/wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: thisWeek, ...form }),
    })

    setSaving(false)
    if (!res.ok) {
      setSaveError('Something went wrong — please try again.')
      return
    }
    setSubmitted(true)
    setShowForm(false)
  }

  // Last 8 weeks for the chart
  const chartData = [...checkins].slice(0, 8).reverse()

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Health</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Wellbeing<br />
          <span className="text-brand">Check-In</span>
        </h1>
        <p className="text-text-secondary text-sm max-w-xl">
          A quick weekly snapshot of how you're feeling. Your coaches can see this alongside your training data.
        </p>
      </div>

      {/* This week's check-in */}
      {showForm ? (
        <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-8">
          <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="p-5">
            <h2 className="font-display text-2xl text-text-primary mb-1">This week</h2>
            <p className="text-xs text-text-secondary mb-6">How are you feeling right now? Takes under 30 seconds.</p>

            <div className="space-y-6">
              {METRICS.map(({ key, label, icon }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{icon}</span>
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    {form[key] > 0 && (
                      <span className={`text-xs ml-auto ${colourForValue(form[key], key === 'stress')}`}>
                        {RATING_LABELS[key][form[key] - 1]}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setForm(f => ({ ...f, [key]: n }))}
                        className={`flex-1 h-10 rounded-xl border text-sm font-data font-bold transition-all ${
                          form[key] === n
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'border-border-light text-text-secondary hover:border-brand/30 hover:text-text-primary'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Comments */}
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">Comments <span className="text-text-secondary font-normal text-xs">(optional)</span></p>
                <textarea
                  value={form.comments}
                  onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                  rows={3}
                  placeholder="Anything you want your coach to know this week — injuries, stress, life events..."
                  className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 resize-none placeholder:text-text-secondary/50"
                />
              </div>
            </div>

            {saveError && (
              <p className="mt-3 text-xs text-status-red text-center">{saveError}</p>
            )}
            <button
              disabled={!form.energy || !form.sleep || !form.stress || saving}
              onClick={handleSubmit}
              className="mt-5 w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Submit check-in'}
            </button>
          </div>
        </div>
      ) : submitted && !hasThisWeek ? (
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5 mb-8 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="font-semibold text-brand">Check-in recorded for this week!</p>
          <p className="text-xs text-text-secondary mt-1">See you next week.</p>
        </div>
      ) : hasThisWeek ? (
        <div className="bg-bg-card border border-brand/20 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">✓ This week done</p>
            <p className="text-xs text-text-secondary mt-0.5">You've already checked in this week.</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setShowForm(true) }}
            className="text-xs text-brand hover:underline"
          >
            Edit
          </button>
        </div>
      ) : null}

      {/* 8-week chart */}
      {chartData.length > 0 && (
        <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
          <div className="p-5 border-b border-border-light">
            <h2 className="font-display text-2xl text-text-primary">8-week trend</h2>
          </div>
          <div className="p-5">
            {METRICS.map(({ key, label, icon, colour, invert }) => (
              <div key={key} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{icon}</span>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {chartData.map(c => {
                    const val = c[key as MetricKey]
                    const heightPct = (val / 5) * 100
                    return (
                      <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: '52px' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-sm ${colour} opacity-80 transition-all`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-text-secondary font-data">{formatWeek(c.week_start)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History list */}
      {checkins.length > 0 && (
        <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border-light">
            <h2 className="font-display text-2xl text-text-primary">History</h2>
          </div>
          <div className="divide-y divide-border-light">
            {checkins.map(c => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-secondary">
                    Week of {new Date(c.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-4 mb-2">
                  {METRICS.map(({ key, label, icon, invert }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs text-text-secondary">{label}</span>
                      <span className={`text-xs font-data font-bold ${colourForValue(c[key as MetricKey], invert)}`}>
                        {c[key as MetricKey]}/5
                      </span>
                    </div>
                  ))}
                </div>
                {c.comments && (
                  <p className="text-xs text-text-secondary italic border-l-2 border-brand/30 pl-3 mt-2">
                    "{c.comments}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
