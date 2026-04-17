import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type AwardType = 'athlete_of_the_month' | 'commitment_club' | 'achievement'

type Award = {
  id: string
  awardType: AwardType
  memberName: string
  body: string
}

type MonthGroup = {
  month: string
  awards: Award[]
}

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

// ─── Filter pills ─────────────────────────────────────────────────────────────

const FILTER_PILLS: { label: string; active: boolean }[] = [
  { label: 'All', active: true },
  { label: 'Athlete of the Month', active: false },
  { label: 'Commitment Club', active: false },
  { label: 'Achievement', active: false },
]

// ─── Seed data (most recent first) ────────────────────────────────────────────

const AWARDS_BY_MONTH: MonthGroup[] = [
  {
    month: 'April 2026',
    awards: [
      {
        id: 'apr26-1',
        awardType: 'athlete_of_the_month',
        memberName: 'Sarah Mitchell',
        body: 'Incredible consistency and attitude throughout April.',
      },
      {
        id: 'apr26-2',
        awardType: 'commitment_club',
        memberName: 'Jamie Pearce',
        body: '16 visits in April!',
      },
      {
        id: 'apr26-3',
        awardType: 'achievement',
        memberName: 'Marcus Webb',
        body: 'Completed Nutrition Foundations pathway.',
      },
    ],
  },
  {
    month: 'January 2026',
    awards: [
      {
        id: 'jan26-1',
        awardType: 'athlete_of_the_month',
        memberName: 'Alex Johnson',
        body: 'New PBs across the board in the January testing block.',
      },
      {
        id: 'jan26-2',
        awardType: 'commitment_club',
        memberName: 'Priya Sharma',
        body: '14 visits in January despite a busy month.',
      },
    ],
  },
  {
    month: 'October 2025',
    awards: [
      {
        id: 'oct25-1',
        awardType: 'athlete_of_the_month',
        memberName: 'Morgan Evans',
        body: 'Phenomenal effort across the whole testing block.',
      },
      {
        id: 'oct25-2',
        awardType: 'achievement',
        memberName: 'Casey Roberts',
        body: 'First pull-up! Months of hard work paid off.',
      },
      {
        id: 'oct25-3',
        awardType: 'achievement',
        memberName: 'Jordan Williams',
        body: 'Completed the Movement Fundamentals pathway.',
      },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AwardsArchivePage() {
  return (
    <div className="space-y-6">

      {/* Back link + page header */}
      <div>
        <Link
          href="/community"
          className="text-xs text-text-secondary hover:text-brand transition-colors font-medium mb-3 inline-block"
        >
          ← Community
        </Link>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Community
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary">Awards</h1>
      </div>

      {/* Filter pills */}
      <div>
        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => (
            <span
              key={pill.label}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                pill.active
                  ? 'bg-brand text-white border-brand'
                  : 'bg-bg-card text-text-secondary border-border-light'
              }`}
            >
              {pill.label}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-text-secondary mt-2">(filter coming soon)</p>
      </div>

      {/* Awards grouped by month */}
      <div className="space-y-8">
        {AWARDS_BY_MONTH.map((group) => (
          <section key={group.month}>
            {/* Month heading */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-semibold text-text-primary">{group.month}</h2>
              <div className="flex-1 h-px bg-border-light" />
            </div>

            {/* Award cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.awards.map((award) => {
                const cfg = AWARD_CONFIG[award.awardType]
                return (
                  <div
                    key={award.id}
                    className={`relative rounded-2xl border p-5 overflow-hidden ${cfg.bg} ${cfg.border}`}
                  >
                    {/* accent bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentBar}`}
                    />

                    {/* Emoji */}
                    <div className="text-3xl mb-3">{cfg.emoji}</div>

                    {/* Award type label */}
                    <p className={`text-[10px] tracking-[0.15em] uppercase font-semibold mb-1 ${cfg.colour}`}>
                      {cfg.label}
                    </p>

                    {/* Member name */}
                    <p className="font-display font-bold text-text-primary text-base leading-tight mb-2">
                      {award.memberName}
                    </p>

                    {/* Body */}
                    <p className="text-xs text-text-secondary leading-relaxed italic">
                      &ldquo;{award.body}&rdquo;
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

    </div>
  )
}
