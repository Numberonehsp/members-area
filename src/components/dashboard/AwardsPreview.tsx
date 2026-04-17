import Link from 'next/link'

type Award = {
  id: string
  memberName: string
  awardType: 'athlete_of_the_month' | 'commitment_club' | 'achievement'
  title: string
  body?: string
  month: string
}

// Seed data — replace with Supabase query
const SEED_AWARDS: Award[] = [
  {
    id: '1',
    memberName: 'Sarah Mitchell',
    awardType: 'athlete_of_the_month',
    title: 'Athlete of the Month — April 2026',
    body: 'Incredible consistency and attitude throughout April. A true inspiration to the whole gym.',
    month: 'April 2026',
  },
  {
    id: '2',
    memberName: 'Jamie Pearce',
    awardType: 'commitment_club',
    title: 'Commitment Club — April 2026',
    body: '16 visits in April — smashed it!',
    month: 'April 2026',
  },
]

const AWARD_CONFIG = {
  athlete_of_the_month: {
    emoji: '🏆',
    label: 'Athlete of the Month',
    colour: 'text-status-amber',
    bg: 'bg-status-amber/10',
    border: 'border-status-amber/20',
  },
  commitment_club: {
    emoji: '🔥',
    label: 'Commitment Club',
    colour: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
  },
  achievement: {
    emoji: '⭐',
    label: 'Achievement',
    colour: 'text-text-primary',
    bg: 'bg-border-light',
    border: 'border-border-light',
  },
}

export default function AwardsPreview() {
  if (SEED_AWARDS.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
            This Month
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Awards</h2>
        </div>
        <Link
          href="/community/awards"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {SEED_AWARDS.map((award) => {
          const cfg = AWARD_CONFIG[award.awardType]
          return (
            <div
              key={award.id}
              className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${cfg.colour} mb-0.5`}>
                    {cfg.label}
                  </p>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {award.memberName}
                  </p>
                  {award.body && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {award.body}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
