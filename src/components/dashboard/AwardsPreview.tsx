import Link from 'next/link'
import { fetchAwards, StaffHubAward } from '@/lib/staffhub'

const AWARD_CONFIG: Record<StaffHubAward['award_type'], {
  emoji: string
  label: string
  colour: string
  bg: string
  border: string
}> = {
  athlete_of_month: {
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
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default async function AwardsPreview() {
  const awards = await fetchAwards(6)

  if (awards.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
            Recent
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
        {awards.map((award) => {
          const cfg = AWARD_CONFIG[award.award_type]
          return (
            <div
              key={award.id}
              className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-xs font-semibold ${cfg.colour}`}>
                      {cfg.label}
                    </p>
                    <span className="text-[10px] text-text-secondary shrink-0">
                      {formatMonth(award.month)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {award.member_name}
                  </p>
                  {award.reason && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {award.reason}
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
