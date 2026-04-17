// Weekly attendance heatmap — Mon to Sun for the current week
// Seed data replaces GymMaster until the attendance sync is wired up

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Get ISO day index (0=Mon … 6=Sun) for a given Date
function isoDay(d: Date) {
  return (d.getDay() + 6) % 7
}

// Seed: visited Mon, Wed, Fri this week
function getSeedVisitedDays(): boolean[] {
  return [true, false, true, false, true, false, false]
}

function getWeekDates(): Date[] {
  const today = new Date()
  const dayOfWeek = isoDay(today)
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  return DAYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function AttendanceStreak() {
  const weekDates = getWeekDates()
  const visitedDays = getSeedVisitedDays()
  const today = new Date()
  const todayIso = isoDay(today)
  const visitsThisWeek = visitedDays.filter(Boolean).length

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

      {/* Day heatmap */}
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

      {/* Streak badge */}
      <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2">
        <span className="text-base">🔥</span>
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">3 weeks in a row</span> with 3+ visits
        </p>
      </div>
    </div>
  )
}
