import { cookies } from 'next/headers'
import { getMonthlyVisits } from '@/lib/gymmaster'

const MAX_MONTHS_BACK = 24
const MIN_VISITS_FOR_STREAK = 1

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Count how many consecutive months (going back from the current month)
 * have at least `minVisits` visits.
 */
function calcMonthStreak(
  visits: Array<{ year: number; month: number; visitCount: number }>,
  minVisits: number
): number {
  if (visits.length === 0) return 0

  const map = new Map(visits.map(v => [`${v.year}-${v.month}`, v.visitCount]))

  const today = new Date()
  let streak = 0
  let year = today.getFullYear()
  let month = today.getMonth() + 1

  for (let i = 0; i < MAX_MONTHS_BACK; i++) {
    const count = map.get(`${year}-${month}`) ?? 0
    if (count >= minVisits) {
      streak++
    } else {
      break
    }
    month--
    if (month === 0) { month = 12; year-- }
  }

  return streak
}

export default async function AttendanceStreak() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'
  const memberToken = cookieStore.get('gymmaster_token')?.value ?? ''

  const today = new Date()
  const allMonths: Array<{ year: number; month: number; visitCount: number }> = []

  let year = today.getFullYear()
  let month = today.getMonth() + 1
  let monthsFetched = 0
  let streakBroken = false

  while (monthsFetched < MAX_MONTHS_BACK && !streakBroken) {
    const data = await getMonthlyVisits(memberId, year, month, memberToken || undefined)
    allMonths.push({ year, month, visitCount: data.visitCount })
    monthsFetched++

    // Stop early once we've found streak start (0 visits after the first month)
    if (data.visitCount === 0 && monthsFetched > 1) {
      streakBroken = true
    }

    month--
    if (month === 0) { month = 12; year-- }
  }

  const streakMonths = calcMonthStreak(allMonths, MIN_VISITS_FOR_STREAK)

  // Show the last 6 months as a bar chart
  const displayMonths = allMonths.slice(0, 6).reverse()
  const maxVisits = Math.max(...displayMonths.map(m => m.visitCount), 1)
  const thisMonth = allMonths[0]

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            This Month
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Attendance</h2>
        </div>
        <div className="text-right">
          <p className="font-data text-2xl font-semibold text-text-primary leading-none">
            {thisMonth?.visitCount ?? 0}
          </p>
          <p className="text-[10px] text-text-secondary">visits</p>
        </div>
      </div>

      {/* 6-month bar chart */}
      <div className="flex items-end gap-1.5 h-16">
        {displayMonths.map((m) => {
          const isCurrentMonth = m.year === today.getFullYear() && m.month === (today.getMonth() + 1)
          const heightPct = maxVisits > 0 ? (m.visitCount / maxVisits) * 100 : 0
          return (
            <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '44px' }}>
                <div
                  title={`${MONTH_NAMES[m.month - 1]}: ${m.visitCount} visit${m.visitCount !== 1 ? 's' : ''}`}
                  className={`w-full rounded-sm transition-all ${
                    m.visitCount === 0
                      ? 'bg-border-light'
                      : isCurrentMonth
                      ? 'bg-brand shadow-sm shadow-brand/20'
                      : 'bg-brand/50'
                  }`}
                  style={{ height: m.visitCount === 0 ? '4px' : `${Math.max(heightPct, 15)}%` }}
                />
              </div>
              <span className={`text-[9px] font-medium ${isCurrentMonth ? 'text-brand' : 'text-text-secondary'}`}>
                {MONTH_NAMES[m.month - 1]}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2">
        <span className="text-base">🔥</span>
        {streakMonths > 0 ? (
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{streakMonths} month{streakMonths !== 1 ? 's' : ''} in a row</span>
            {' '}with visits
          </p>
        ) : (
          <p className="text-xs text-text-secondary">
            Visit this month to start your streak!
          </p>
        )}
      </div>
    </div>
  )
}
