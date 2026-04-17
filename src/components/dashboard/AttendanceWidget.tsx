import { cookies } from 'next/headers'
import { getMonthlyVisits } from '@/lib/gymmaster'

const COMMITMENT_TARGET = 12

export default async function AttendanceWidget() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'
  const memberToken = cookieStore.get('gymmaster_token')?.value ?? ''

  const now = new Date()
  const data = await getMonthlyVisits(
    memberId,
    now.getFullYear(),
    now.getMonth() + 1,
    memberToken || undefined,
  )

  const { visitCount, visitDates } = data
  const pct = Math.min(Math.round((visitCount / COMMITMENT_TARGET) * 100), 100)
  const remaining = Math.max(COMMITMENT_TARGET - visitCount, 0)
  const qualified = visitCount >= COMMITMENT_TARGET

  const monthName = now.toLocaleString('en-GB', { month: 'long' })
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const today = now.getDate()
  const daysLeft = daysInMonth - today

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            {monthName} Attendance
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Commitment Club</h2>
        </div>
        {qualified && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold shrink-0">
            🏆 Qualified!
          </span>
        )}
      </div>

      {/* Visit count */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-display text-5xl text-text-primary leading-none">{visitCount}</span>
        <span className="text-text-secondary text-sm">/ {COMMITMENT_TARGET} visits</span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-border-light rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            qualified
              ? 'bg-gradient-to-r from-brand to-brand-light'
              : 'bg-gradient-to-r from-brand/60 to-brand'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-text-secondary">
        {qualified
          ? "You're in the draw — keep it up! 🎉"
          : `${remaining} more visit${remaining !== 1 ? 's' : ''} needed · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${monthName}`
        }
      </p>

      {/* Visit dot grid */}
      {visitDates.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
            const visited = visitDates.includes(dayStr)
            const isPast = i + 1 <= today
            return (
              <div
                key={i}
                title={dayStr}
                className={`w-3 h-3 rounded-sm transition-colors ${
                  visited
                    ? 'bg-brand'
                    : isPast
                    ? 'bg-border-light'
                    : 'bg-bg-main border border-border-light'
                }`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
