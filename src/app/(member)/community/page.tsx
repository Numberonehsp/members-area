import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type AwardType = 'athlete_of_the_month' | 'commitment_club' | 'achievement'

type MonthAward = {
  id: string
  awardType: AwardType
  memberName: string
  body: string
}

type Challenge = {
  id: string
  title: string
  description: string
  current: number
  target: number
  unit: string
  daysLeft: number
  type: 'attendance' | 'education'
}

type LeaderboardEntry = {
  rank: number
  name: string
  visits: number
  isCurrentUser?: boolean
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const THIS_MONTH_AWARDS: MonthAward[] = [
  {
    id: '1',
    awardType: 'athlete_of_the_month',
    memberName: 'Sarah Mitchell',
    body: 'Incredible consistency and attitude throughout April. A true inspiration to the whole gym.',
  },
  {
    id: '2',
    awardType: 'commitment_club',
    memberName: 'Jamie Pearce',
    body: '16 visits in April — smashed it!',
  },
  {
    id: '3',
    awardType: 'achievement',
    memberName: 'Marcus Webb',
    body: 'Completed the full Nutrition Foundations pathway. Outstanding commitment.',
  },
]

const ACTIVE_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'April Attendance Challenge',
    description: 'Hit 16 visits this month',
    current: 9,
    target: 16,
    unit: 'visits',
    daysLeft: 21,
    type: 'attendance',
  },
  {
    id: '2',
    title: 'Nutrition Pathway Sprint',
    description: 'Complete 4 nutrition modules',
    current: 2,
    target: 4,
    unit: 'modules',
    daysLeft: 14,
    type: 'education',
  },
]

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Morgan Evans', visits: 18 },
  { rank: 2, name: 'Priya Sharma', visits: 16 },
  { rank: 3, name: 'Alex Johnson', visits: 14 },
  { rank: 4, name: 'Sam Davies', visits: 12 },
  { rank: 5, name: 'Tom Hughes', visits: 9 },
]

// ─── Award config ─────────────────────────────────────────────────────────────

const AWARD_CONFIG: Record<AwardType, {
  emoji: string
  label: string
  colour: string
  bg: string
  border: string
  accentBar: string
}> = {
  athlete_of_the_month: {
    emoji: '🏆',
    label: 'Athlete of the Month',
    colour: 'text-status-amber',
    bg: 'bg-status-amber/10',
    border: 'border-status-amber/20',
    accentBar: 'from-status-amber to-transparent',
  },
  commitment_club: {
    emoji: '🔥',
    label: 'Commitment Club',
    colour: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
    accentBar: 'from-brand to-transparent',
  },
  achievement: {
    emoji: '⭐',
    label: 'Achievement',
    colour: 'text-text-primary',
    bg: 'bg-border-light',
    border: 'border-border-light',
    accentBar: 'from-border-light to-transparent',
  },
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityHubPage() {
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Community
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary">Community Hub</h1>
      </div>

      {/* ── This Month's Awards ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
              April 2026
            </p>
            <h2 className="font-semibold text-text-primary">This Month&apos;s Awards</h2>
          </div>
          <Link
            href="/community/awards"
            className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
          >
            View archive →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THIS_MONTH_AWARDS.map((award) => {
            const cfg = AWARD_CONFIG[award.awardType]
            return (
              <div
                key={award.id}
                className={`relative rounded-2xl border p-5 overflow-hidden ${cfg.bg} ${cfg.border}`}
              >
                {/* accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentBar}`} />

                {/* Big emoji */}
                <div className="text-4xl mb-3">{cfg.emoji}</div>

                {/* Award type label */}
                <p className={`text-[10px] tracking-[0.15em] uppercase font-semibold mb-1 ${cfg.colour}`}>
                  {cfg.label}
                </p>

                {/* Member name */}
                <p className="font-display font-bold text-text-primary text-lg leading-tight mb-2">
                  {award.memberName}
                </p>

                {/* Body / quote */}
                <p className="text-xs text-text-secondary leading-relaxed italic">
                  &ldquo;{award.body}&rdquo;
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Two-column grid: Challenges + Leaderboard ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Active Challenges */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
                Active
              </p>
              <h2 className="font-semibold text-text-primary">Active Challenges</h2>
            </div>
            <Link
              href="/community"
              className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            {ACTIVE_CHALLENGES.map((challenge) => {
              const pct = Math.min(Math.round((challenge.current / challenge.target) * 100), 100)
              return (
                <div key={challenge.id} className="rounded-xl border border-border-light bg-bg-main p-4">
                  <Link href={`/community/challenge/${challenge.id}`} className="block group mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
                        {challenge.title}
                      </p>
                      <span className="text-[10px] text-text-secondary bg-border-light rounded-full px-2 py-0.5 shrink-0 ml-2 font-medium">
                        {challenge.daysLeft}d left
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">{challenge.description}</p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-border-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-data text-xs text-text-secondary shrink-0">
                        {challenge.current}/{challenge.target} {challenge.unit}
                      </span>
                    </div>
                  </Link>

                  {/* Join button — cosmetic */}
                  <button
                    type="button"
                    className="w-full text-xs font-medium text-brand border border-brand/30 rounded-lg py-1.5 hover:bg-brand/10 transition-colors"
                  >
                    Join Challenge
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Attendance Leaderboard */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-amber via-brand to-transparent" />

          <div className="mb-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">
              April 2026
            </p>
            <h2 className="font-semibold text-text-primary">Top Attendees</h2>
          </div>

          <div className="space-y-2">
            {LEADERBOARD.map((entry) => {
              const medal = RANK_MEDAL[entry.rank]
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    entry.isCurrentUser
                      ? 'bg-brand/10 border border-brand/20'
                      : 'bg-bg-main border border-border-light'
                  }`}
                >
                  {/* Rank */}
                  <span className="w-6 text-center shrink-0">
                    {medal ? (
                      <span className="text-base">{medal}</span>
                    ) : (
                      <span className="font-data text-xs text-text-secondary">{entry.rank}</span>
                    )}
                  </span>

                  {/* Name */}
                  <span className={`flex-1 text-sm font-medium ${entry.isCurrentUser ? 'text-brand' : 'text-text-primary'}`}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-1.5 text-[10px] text-brand font-semibold">(you)</span>
                    )}
                  </span>

                  {/* Visits */}
                  <span className="font-data text-sm font-semibold text-text-primary shrink-0">
                    {entry.visits}
                    <span className="font-sans text-[10px] text-text-secondary font-normal ml-1">visits</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
