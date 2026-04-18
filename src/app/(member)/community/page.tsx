import Link from 'next/link'
import { cookies } from 'next/headers'
import { fetchChallenges, fetchAwards, fetchGymEvents, fetchMemberEvents } from '@/lib/staffhub'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  return `${fmt(start)} — ${fmt(end)}`
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function CommunityHubPage() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'

  const [challenges, awards, gymEvents, memberEvents] = await Promise.all([
    fetchChallenges(100),
    fetchAwards(20),
    fetchGymEvents(),
    fetchMemberEvents(memberId),
  ])

  const commitmentWinners = awards.filter(a => a.award_type === 'commitment_club')
  const athleteWinners = awards.filter(a => a.award_type === 'athlete_of_month')

  // Gym events in the next 4 weeks
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fourWeeks = new Date(today)
  fourWeeks.setDate(fourWeeks.getDate() + 28)
  const todayStr = today.toISOString().split('T')[0]
  const fourWeeksStr = fourWeeks.toISOString().split('T')[0]

  const upcomingGymEvents = gymEvents.filter(e =>
    e.start_date >= todayStr && e.start_date <= fourWeeksStr
  )

  // Member's own upcoming events in the next 4 weeks
  const upcomingPersonalEvents = memberEvents.filter(e =>
    e.event_date >= todayStr && e.event_date <= fourWeeksStr
  )

  // Merge and sort by date
  type UpcomingItem =
    | { kind: 'gym'; id: string; title: string; date: string; type: string }
    | { kind: 'personal'; id: string; title: string; date: string }

  const upcomingItems: UpcomingItem[] = [
    ...upcomingGymEvents.map(e => ({
      kind: 'gym' as const,
      id: e.id,
      title: e.title,
      date: e.start_date,
      type: e.event_type,
    })),
    ...upcomingPersonalEvents.map(e => ({
      kind: 'personal' as const,
      id: e.id,
      title: e.event_name,
      date: e.event_date,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const EVENT_TYPE_LABELS: Record<string, string> = {
    competition: 'Competition',
    six_week_start: '6-Week Start',
    other: 'Event',
  }

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-1">
          Community
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">
          Community<br /><span className="text-brand">Hub</span>
        </h1>
      </div>

      {/* ── Upcoming Events (next 4 weeks) ───────────────────────────────── */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">Next 4 weeks</p>
          <h2 className="font-semibold text-text-primary">Upcoming Events</h2>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
            <p className="text-text-secondary text-sm">No events in the next 4 weeks.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingItems.map((item) => {
              const days = daysUntil(item.date)
              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="bg-bg-card border border-border-light rounded-2xl px-4 py-3 flex items-center gap-3 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
                  <span className="text-lg shrink-0">{item.kind === 'personal' ? '🎯' : '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{item.title}</p>
                    <p className="text-xs text-text-secondary">{formatDate(item.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.kind === 'personal' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold">
                        Your event
                      </span>
                    )}
                    {item.kind === 'gym' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-light text-text-secondary font-semibold">
                        {EVENT_TYPE_LABELS[item.type] ?? 'Event'}
                      </span>
                    )}
                    <span className="text-[10px] font-data font-semibold text-text-secondary w-10 text-right">
                      {days === 0 ? 'Today' : `${days}d`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Active Challenges ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">Active</p>
          <h2 className="font-semibold text-text-primary">Challenges</h2>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
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
                    <h3 className="font-semibold text-text-primary text-sm mb-1">{challenge.name}</h3>
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

      {/* ── Commitment Club Winners ───────────────────────────────────────── */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">Past Winners</p>
          <h2 className="font-semibold text-text-primary">🔥 Commitment Club</h2>
        </div>

        {commitmentWinners.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
            <p className="text-text-secondary text-sm">No past winners yet.</p>
          </div>
        ) : (
          <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border-light">
              {commitmentWinners.map((award) => (
                <div key={award.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-base shrink-0">🔥</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{award.member_name}</p>
                    {award.reason && (
                      <p className="text-xs text-text-secondary truncate">{award.reason}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-text-secondary shrink-0">{formatMonth(award.month)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Athlete of the Month Winners ─────────────────────────────────── */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-amber font-semibold mb-0.5">Past Winners</p>
          <h2 className="font-semibold text-text-primary">🏆 Athlete of the Month</h2>
        </div>

        {athleteWinners.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 text-center">
            <p className="text-text-secondary text-sm">No past winners yet.</p>
          </div>
        ) : (
          <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border-light">
              {athleteWinners.map((award) => (
                <div key={award.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-base shrink-0">🏆</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{award.member_name}</p>
                    {award.reason && (
                      <p className="text-xs text-text-secondary truncate">{award.reason}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-text-secondary shrink-0">{formatMonth(award.month)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
