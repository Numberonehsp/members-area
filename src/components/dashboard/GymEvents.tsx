// Gym Events widget — social events and competitions
// Seed data — replace with Supabase announcements or a dedicated events table

type GymEvent = {
  id: string
  title: string
  date: string        // ISO date string
  type: 'social' | 'competition' | 'workshop' | 'other'
  description?: string
  location?: string
}

const SEED_EVENTS: GymEvent[] = [
  {
    id: '1',
    title: 'HSP Summer Social',
    date: '2026-05-10',
    type: 'social',
    description: 'End of block celebration — food, drinks and prize giving. All members welcome.',
    location: 'The Queensferry Arms',
  },
  {
    id: '2',
    title: 'Charity Deadlift Competition',
    date: '2026-05-24',
    type: 'competition',
    description: 'In-house charity competition. Open to all levels. Sign-up sheet on the board.',
    location: 'Number One HSP Gym',
  },
  {
    id: '3',
    title: 'Nutrition Workshop',
    date: '2026-06-07',
    type: 'workshop',
    description: 'Deep dive into fuelling for performance with our head coach.',
    location: 'Number One HSP Gym',
  },
]

const TYPE_CONFIG = {
  social:      { emoji: '🎉', colour: 'text-brand',         bg: 'bg-brand/10',         border: 'border-brand/20' },
  competition: { emoji: '🏆', colour: 'text-status-amber',  bg: 'bg-status-amber/10',  border: 'border-status-amber/20' },
  workshop:    { emoji: '📚', colour: 'text-text-primary',  bg: 'bg-border-light',     border: 'border-border-light' },
  other:       { emoji: '📌', colour: 'text-text-secondary', bg: 'bg-bg-main',          border: 'border-border-light' },
}

function formatEventDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function daysUntil(isoDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function GymEvents() {
  const upcoming = SEED_EVENTS
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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

      {upcoming.length === 0 ? (
        <p className="text-sm text-text-secondary">No upcoming events — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((event) => {
            const cfg = TYPE_CONFIG[event.type]
            const days = daysUntil(event.date)
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
                        {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : formatEventDate(event.date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-secondary leading-relaxed mb-1">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-[11px] text-text-secondary">
                        📍 {event.location}
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
