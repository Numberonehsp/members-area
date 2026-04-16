// Challenges preview — async Server Component, fetches live data from Staff Hub

import Link from 'next/link'
import { fetchChallenges } from '@/lib/staffhub'

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  return `${fmt(start)} — ${fmt(end)}`
}

export default async function ChallengesPreview() {
  const challenges = await fetchChallenges(3)

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

      {challenges.length === 0 ? (
        <p className="text-sm text-text-secondary">No active challenges right now.</p>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="rounded-xl border border-border-light bg-bg-main p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-text-primary leading-tight">
                  {challenge.name}
                </p>
                <Link
                  href={`/community/challenge/${challenge.id}`}
                  className="text-[10px] font-semibold text-brand shrink-0 hover:text-brand-dark transition-colors"
                >
                  View →
                </Link>
              </div>
              <p className="text-[11px] text-text-secondary">
                {formatDateRange(challenge.start_date, challenge.end_date)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
