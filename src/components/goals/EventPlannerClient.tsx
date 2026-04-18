'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberEvent } from '@/lib/staffhub'

const MAX_EVENTS = 3

function formatEventDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(iso + 'T00:00:00')
  return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function EventPlannerClient({
  initialEvents,
}: {
  initialEvents: MemberEvent[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState<MemberEvent[]>(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd = events.length < MAX_EVENTS

  const today = new Date().toISOString().split('T')[0]

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/member-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, event_date: eventDate }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    setEvents((prev) =>
      [...prev, json.event].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
    )
    setEventName('')
    setEventDate('')
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/member-events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Events
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Upcoming Events</h2>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setError(null) }}
            className="text-xs bg-brand hover:bg-brand-dark text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {/* Event list */}
      {events.length > 0 && (
        <div className="space-y-2 mb-4">
          {events.map((ev) => {
            const days = daysUntil(ev.event_date)
            const isPast = days < 0
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 bg-bg-main border border-border-light rounded-xl px-4 py-3"
              >
                <span className="text-lg">📅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{ev.event_name}</p>
                  <p className="text-xs text-text-secondary">{formatEventDate(ev.event_date)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isPast ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold font-data">
                      {days}d
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="text-text-secondary hover:text-status-red transition-colors"
                    aria-label={`Remove ${ev.event_name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && !showForm && (
        <p className="text-sm text-text-secondary mb-4">
          Add races, competitions, or other important dates — up to 3 events.
        </p>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-border-light pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Event name
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Hyrox Manchester"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Date
            </label>
            <input
              required
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          {error && (
            <p className="text-xs text-status-red">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save event'}
            </button>
          </div>
        </form>
      )}

      {/* Cap notice */}
      {events.length >= MAX_EVENTS && (
        <p className="text-xs text-text-secondary mt-2">
          3 events saved — remove one to add another.
        </p>
      )}
    </div>
  )
}
