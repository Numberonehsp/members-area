import { cookies } from 'next/headers'
import { getAnnualVisits } from '@/lib/gymmaster'

const COMMITMENT_TARGET = 12
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Count consecutive months going back from current month that have >= 1 visit.
 * Only uses data we actually have (current year from GymMaster).
 */
function calcStreak(
  months: Array<{ month: number; visitCount: number }>,
  currentMonth: number
): number {
  let streak = 0
  let m = currentMonth
  while (m >= 1) {
    const entry = months.find(x => x.month === m)
    if ((entry?.visitCount ?? 0) >= 1) {
      streak++
      m--
    } else {
      break
    }
  }
  return streak
}

export default async function AttendanceStreak() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'
  const memberToken = cookieStore.get('gymmaster_token')?.value ?? ''

  const today = new Date()
  const currentMonth = today.getMonth() + 1

  // Single API call — returns all 12 months for the current year
  const annualData = await getAnnualVisits(memberId, memberToken || undefined)

  const thisMonthData = annualData.find(m => m.month === currentMonth)
  const visitCount = thisMonthData?.visitCount ?? 0
  const streakMonths = calcStreak(annualData, currentMonth)

  const monthName = today.toLocaleString('en-GB', { month: 'long' })
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate()
  const remaining = Math.max(COMMITMENT_TARGET - visitCount, 0)
  const qualified = visitCount >= COMMITMENT_TARGET
  const pct = Math.min(Math.round((visitCount / COMMITMENT_TARGET) * 100), 100)

  // Show up to 6 months ending at current month, oldest → newest
  const startMonth = Math.max(1, currentMonth - 5)
  const displayMonths = annualData.filter(m => m.month >= startMonth && m.month <= currentMonth)
  const maxVisits = Math.max(...displayMonths.map(m => m.visitCount), 1)

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            Attendance
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Commitment Club</h2>
        </div>
        <div className="text-right">
          {qualified ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold">
              🏆 Qualified!
            </span>
          ) : (
            <>
              <p className="font-data text-2xl font-semibold text-text-primary leading-none">
                {visitCount}<span className="text-sm font-normal text-text-secondary">/{COMMITMENT_TARGET}</span>
              </p>
              <p className="text-[10px] text-text-secondary">visits this month</p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border-light rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            qualified ? 'bg-gradient-to-r from-brand to-brand-light' : 'bg-gradient-to-r from-brand/60 to-brand'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-text-secondary mb-4">
        {qualified
          ? "You're in the draw — keep it up! 🎉"
          : `${remaining} more visit${remaining !== 1 ? 's' : ''} needed · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${monthName}`}
      </p>

      {/* Monthly bar chart — current year only */}
      <div className="flex items-end gap-1.5 h-14">
        {displayMonths.map((m) => {
          const isCurrent = m.month === currentMonth
          const heightPct = m.visitCount > 0 ? Math.max((m.visitCount / maxVisits) * 100, 12) : 0
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '40px' }}>
                <div
                  title={`${MONTH_NAMES[m.month - 1]}: ${m.visitCount} visit${m.visitCount !== 1 ? 's' : ''}`}
                  className={`w-full rounded-sm transition-all ${
                    m.visitCount === 0 ? 'bg-border-light' : isCurrent ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-brand/50'
                  }`}
                  style={{ height: m.visitCount === 0 ? '3px' : `${heightPct}%` }}
                />
              </div>
              <span className={`text-[9px] font-medium ${isCurrent ? 'text-brand' : 'text-text-secondary'}`}>
                {MONTH_NAMES[m.month - 1]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Streak */}
      <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2">
        <span className="text-base">🔥</span>
        {streakMonths > 0 ? (
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{streakMonths} month{streakMonths !== 1 ? 's' : ''} in a row</span>
            {' '}with visits
          </p>
        ) : (
          <p className="text-xs text-text-secondary">Visit this month to start your streak!</p>
        )}
      </div>
    </div>
  )
}
