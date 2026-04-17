import Link from 'next/link'
import { fetchChallenges } from '@/lib/staffhub'

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  return `${fmt(start)} — ${fmt(end)}`
}

export default async function CommunityHubPage() {
  const challenges = await fetchChallenges(100)

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Community
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary">Community Hub</h1>
      </div>

      {/* ── Active Challenges ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
              Active
            </p>
            <h2 className="font-semibold text-text-primary">Active Challenges</h2>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
            <p className="text-text-secondary text-sm">No active challenges right now — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm mb-1">
                      {challenge.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary mb-2">
                      {formatDateRange(challenge.start_date, challenge.end_date)}
                    </p>
                    {challenge.description && (
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {challenge.description}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/community/challenge/${challenge.id}`}
                    className="shrink-0 text-xs font-semibold text-brand border border-brand/30 rounded-lg px-3 py-1.5 hover:bg-brand/10 transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
