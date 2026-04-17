// Next Test Week widget
// Seed data — replace with Supabase query when coach inputs testing blocks

const NEXT_TEST_WEEK = {
  weekCommencing: '2026-04-14', // ISO date — Monday of the test week
  notes: 'Back Squat, Deadlift, 500m Row and Pull-Up test. Book your slot with the coaching team.',
}

function formatWeekCommencing(isoDate: string) {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(isoDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function NextTestWeek() {
  const days = daysUntil(NEXT_TEST_WEEK.weekCommencing)
  const isPast = days < 0
  const isThisWeek = days >= 0 && days <= 6
  const isSoon = days > 6 && days <= 14

  const urgencyColour = isPast
    ? 'text-text-secondary'
    : isThisWeek
    ? 'text-status-green'
    : isSoon
    ? 'text-status-amber'
    : 'text-brand'

  const urgencyBadge = isPast
    ? null
    : isThisWeek
    ? { label: 'This week!', bg: 'bg-status-green/10 text-status-green border-status-green/20' }
    : isSoon
    ? { label: `${days} days`, bg: 'bg-status-amber/10 text-status-amber border-status-amber/20' }
    : { label: `${days} days`, bg: 'bg-brand/10 text-brand border-brand/20' }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            S&amp;C Testing
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Next Test Week</h2>
        </div>
        <span className="text-xl shrink-0">🏋️</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <p className={`font-semibold text-sm ${urgencyColour}`}>
          w/c {formatWeekCommencing(NEXT_TEST_WEEK.weekCommencing)}
        </p>
        {urgencyBadge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${urgencyBadge.bg}`}>
            {urgencyBadge.label}
          </span>
        )}
      </div>

      {NEXT_TEST_WEEK.notes && (
        <p className="text-xs text-text-secondary leading-relaxed">
          {NEXT_TEST_WEEK.notes}
        </p>
      )}

      {isPast && (
        <p className="text-xs text-text-secondary mt-2 italic">
          Testing block complete — results will appear in your S&amp;C dashboard.
        </p>
      )}
    </div>
  )
}
