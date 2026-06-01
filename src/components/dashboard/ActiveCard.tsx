import Link from 'next/link'
import { cookies } from 'next/headers'
import { fetchMemberChallenges, fetchMemberBaFSignups } from '@/lib/staffhub'
import { getPendingTasks } from '@/lib/tasks'
import ActiveCardTasks from './ActiveCardTasks'

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  return `${fmt(start)} — ${fmt(end)}`
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default async function ActiveCard() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''

  if (!memberId) return null

  const [tasks, challenges, bafSignups] = await Promise.all([
    getPendingTasks(memberId),
    fetchMemberChallenges(memberId),
    fetchMemberBaFSignups(memberId),
  ])

  if (tasks.length === 0 && challenges.length === 0 && bafSignups.length === 0) {
    return null
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Active
          </p>
          <h2 className="font-semibold text-text-primary text-sm">What&apos;s On</h2>
        </div>
        <Link
          href="/community"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {/* Tasks */}
        {tasks.length > 0 && (
          <>
            <ActiveCardTasks initialTasks={tasks} />
            {(challenges.length > 0 || bafSignups.length > 0) && (
              <hr className="border-border-light" />
            )}
          </>
        )}

        {/* Challenges the member is enrolled in */}
        {challenges.length > 0 && (
          <>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
                Challenges you&apos;re in
              </p>
              <div className="space-y-2">
                {challenges.map(c => (
                  <div
                    key={c.challenge_id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-border-light bg-bg-main p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary leading-tight">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {formatDateRange(c.start_date, c.end_date)}
                      </p>
                    </div>
                    <Link
                      href={`/community/challenge/${c.challenge_id}`}
                      className="text-[10px] font-semibold text-brand shrink-0 hover:text-brand-dark transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            {bafSignups.length > 0 && <hr className="border-border-light" />}
          </>
        )}

        {/* Bring-a-Friend events registered */}
        {bafSignups.length > 0 && (
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-text-secondary font-semibold mb-2">
              Guest sessions
            </p>
            <div className="space-y-2">
              {bafSignups.map(s => (
                <div
                  key={s.event_id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border-light bg-bg-main p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-tight">
                      🤝 {s.title}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {formatDate(s.start_date)}
                    </p>
                  </div>
                  <Link
                    href={`/community/bring-a-friend/${s.event_id}`}
                    className="text-[10px] font-semibold text-brand shrink-0 hover:text-brand-dark transition-colors"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
