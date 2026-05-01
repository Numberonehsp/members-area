import Link from 'next/link'
import { fetchAwards } from '@/lib/staffhub'
import type { StaffHubAward } from '@/lib/staffhub'
import NominationForm from './NominationForm'

// ─── Award config ─────────────────────────────────────────────────────────────

const AWARD_CONFIG: Record<string, {
  emoji: string
  label: string
  colour: string
  bg: string
  border: string
  accentBar: string
}> = {
  athlete_of_month: {
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
}

function formatMonth(dateStr: string): string {
  // dateStr is ISO date e.g. '2026-04-01'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function groupByMonth(awards: StaffHubAward[]): { month: string; label: string; awards: StaffHubAward[] }[] {
  const map = new Map<string, StaffHubAward[]>()
  for (const a of awards) {
    const key = a.month.slice(0, 7) // 'YYYY-MM'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    month: key,
    label: formatMonth(key + '-01'),
    awards: items,
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AwardsArchivePage() {
  const awards = await fetchAwards(30)
  const groups = groupByMonth(awards)

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

      {/* Nominate a member */}
      <NominationForm />

      {/* Awards archive */}
      {groups.length === 0 ? (
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
          <p className="text-text-muted text-sm">No awards announced yet — check back soon! 🏆</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.month}>
              {/* Month heading */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-semibold text-text-primary">{group.label}</h2>
                <div className="flex-1 h-px bg-border-light" />
              </div>

              {/* Award cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.awards.map((award) => {
                  const cfg = AWARD_CONFIG[award.award_type] ?? AWARD_CONFIG['commitment_club']
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
                        {award.member_name}
                      </p>

                      {/* Reason */}
                      {award.reason && (
                        <p className="text-xs text-text-secondary leading-relaxed italic">
                          &ldquo;{award.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
