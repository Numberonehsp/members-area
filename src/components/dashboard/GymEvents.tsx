// Gym Events widget — async Server Component, fetches live data from Staff Hub

import { fetchGymEvents } from '@/lib/staffhub'

const EVENT_TYPE_CONFIG: Record<string, { emoji: string; colour: string; bg: string; border: string; label: string }> = {
  social:      { emoji: '🎉', colour: 'text-brand',          bg: 'bg-brand/10',        border: 'border-brand/20',        label: 'Social' },
  competition: { emoji: '🏆', colour: 'text-status-amber',   bg: 'bg-status-amber/10', border: 'border-status-amber/20', label: 'Competition' },
  workshop:    { emoji: '📚', colour: 'text-text-primary',   bg: 'bg-border-light',    border: 'border-border-light',    label: 'Workshop' },
  other:       { emoji: '📌', colour: 'text-text-secondary', bg: 'bg-bg-main',         border: 'border-border-light',    label: 'Event' },
}

function getTypeConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] ?? EVENT_TYPE_CONFIG.other
}

function formatEventDate(isoDate: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function daysUntil(isoDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function GymEvents() {
  const events = await fetchGymEvents()

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Coming Up
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Gym Events</h2>
        </div>
        <span className="text-xl">📅</span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-secondary">No upcoming events — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const cfg = getTypeConfig(event.event_type)
            const days = daysUntil(event.start_date)
            return (
              <div key={event.id} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 mt-0.5">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary leading-tight">
                        {event.title}
                      </p>
                      <span className={`text-[10px] font-semibold shrink-0 ${cfg.colour}`}>
                        {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : formatEventDate(event.start_date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
