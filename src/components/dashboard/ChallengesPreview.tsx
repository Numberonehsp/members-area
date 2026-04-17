import Link from 'next/link'

type Challenge = {
  id: string
  title: string
  description: string
  current: number
  target: number
  unit: string
  daysLeft: number
}

// Seed data — replace with Supabase query
const SEED_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'April Attendance Challenge',
    description: 'Hit 16 visits this month',
    current: 9,
    target: 16,
    unit: 'visits',
    daysLeft: 21,
  },
  {
    id: '2',
    title: 'Nutrition Pathway Sprint',
    description: 'Complete 4 nutrition modules',
    current: 2,
    target: 4,
    unit: 'modules',
    daysLeft: 14,
  },
]

export default function ChallengesPreview() {
  if (SEED_CHALLENGES.length === 0) return null

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Active
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Challenges</h2>
        </div>
        <Link
          href="/community"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {SEED_CHALLENGES.map((challenge) => {
          const pct = Math.min(Math.round((challenge.current / challenge.target) * 100), 100)
          return (
            <Link
              key={challenge.id}
              href={`/community/challenge/${challenge.id}`}
              className="block group"
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                  {challenge.title}
                </p>
                <span className="text-[10px] text-text-secondary shrink-0 ml-2">
                  {challenge.daysLeft}d left
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-2">{challenge.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-data text-xs text-text-secondary shrink-0">
                  {challenge.current}/{challenge.target}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
