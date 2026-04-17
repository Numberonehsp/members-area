import { cookies } from 'next/headers'
import { getMonthlyVisits } from '@/lib/gymmaster'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MIN_VISITS_FOR_STREAK = 3
const MAX_MONTHS_BACK = 24

/** Returns ISO day index 0=Mon … 6=Sun */
function isoDay(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** Returns the Monday of the week containing `date` at midnight */
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - isoDay(d))
  return d
}

/** Returns an ISO date string 'YYYY-MM-DD' for a Date */
function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Count how many consecutive weeks (going back from the current week)
 * have at least `minVisits` visits, given a flat array of visit date strings.
 */
function calcStreak(visitDates: string[], minVisits: number): number {
  if (visitDates.length === 0) return 0

  const visitSet = new Set(visitDates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let weekMonday = getMondayOf(today)

  const maxWeeks = MAX_MONTHS_BACK * 5

  for (let w = 0; w < maxWeeks; w++) {
    let count = 0
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday)
      day.setDate(weekMonday.getDate() + d)
      if (day > today) break
      if (visitSet.has(toISO(day))) count++
    }

    if (count >= minVisits) {
      streak++
    } else {
      break
    }

    weekMonday = new Date(weekMonday)
    weekMonday.setDate(weekMonday.getDate() - 7)
  }

  return streak
}

export default async function AttendanceStreak() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? 'seed'
  const memberToken = cookieStore.get('gymmaster_token')?.value ?? ''

  const allVisitDates: string[] = []
  const today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth() + 1
  let monthsFetched = 0
  let streakBroken = false

  while (monthsFetched < MAX_MONTHS_BACK && !streakBroken) {
    const data = await getMonthlyVisits(memberId, year, month, memberToken || undefined)
    allVisitDates.push(...data.visitDates)
    monthsFetched++

    if (data.visitDates.length === 0 && monthsFetched > 1) {
      streakBroken = true
    }

    month--
    if (month === 0) {
      month = 12
      year--
    }
  }

  const weekMonday = getMondayOf(today)
  const visitSet = new Set(allVisitDates)
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + i)
    return d
  })
  const visitedDays = weekDates.map(d => visitSet.has(toISO(d)))
  const visitsThisWeek = visitedDays.filter(Boolean).length
  const todayIso = isoDay(today)

  const streakWeeks = calcStreak(allVisitDates, MIN_VISITS_FOR_STREAK)

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            This Week
          </p>
          <h2 className="font-semibold text-text-primary text-sm">Attendance Streak</h2>
        </div>
        <div className="text-right">
          <p className="font-data text-2xl font-semibold text-text-primary leading-none">
            {visitsThisWeek}
          </p>
          <p className="text-[10px] text-text-secondary">visits</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const isPast = i < todayIso
          const isToday = i === todayIso
          const isFuture = i > todayIso
          const visited = visitedDays[i]

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-medium ${isToday ? 'text-brand' : 'text-text-secondary'}`}>
                {day}
              </span>
              <div
                title={date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                  visited
                    ? 'bg-brand shadow-sm shadow-brand/20'
                    : isPast
                    ? 'bg-border-light'
                    : isToday
                    ? 'border-2 border-brand/40 bg-brand/5'
                    : isFuture
                    ? 'bg-bg-main border border-border-light'
                    : 'bg-bg-main'
                }`}
              >
                {visited && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2">
        <span className="text-base">🔥</span>
        {streakWeeks > 0 ? (
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{streakWeeks} week{streakWeeks !== 1 ? 's' : ''} in a row</span>
            {' '}with {MIN_VISITS_FOR_STREAK}+ visits
          </p>
        ) : (
          <p className="text-xs text-text-secondary">
            Hit {MIN_VISITS_FOR_STREAK}+ visits this week to start your streak!
          </p>
        )}
      </div>
    </div>
  )
}
