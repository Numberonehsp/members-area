import { describe, it, expect } from 'vitest'
import {
  canAddHabit,
  currentPeriodValue,
  progressPct,
  isExpired,
  minutesToHoursMinutes,
  hoursMinutesToMinutes,
  formatMetricValue,
  type HabitLogEntry,
} from '@/lib/habit-logic'

describe('canAddHabit', () => {
  it('allows adding below the cap', () => {
    expect(canAddHabit(4, 5)).toBe(true)
  })
  it('blocks adding at the cap', () => {
    expect(canAddHabit(5, 5)).toBe(false)
  })
  it('blocks adding above the cap', () => {
    expect(canAddHabit(6, 5)).toBe(false)
  })
})

describe('currentPeriodValue — daily cadence', () => {
  const logs: HabitLogEntry[] = [
    { date: '2026-10-04', value: 10 },
    { date: '2026-10-05', value: 20 },
    { date: '2026-10-06', value: 30 },
  ]

  it("returns today's entry", () => {
    expect(currentPeriodValue(logs, 'daily', null, '2026-10-06')).toBe(30)
  })

  it('returns null when nothing logged today', () => {
    expect(currentPeriodValue(logs, 'daily', null, '2026-10-07')).toBeNull()
  })
})

describe('currentPeriodValue — weekly cadence', () => {
  // 7-day window ending 2026-10-06 is 2026-09-30..2026-10-06 inclusive
  const logs: HabitLogEntry[] = [
    { date: '2026-09-29', value: 1000 }, // outside the window — must be excluded
    { date: '2026-09-30', value: 100 },
    { date: '2026-10-02', value: 200 },
    { date: '2026-10-06', value: 300 },
  ]

  it('sums the window for total aggregation', () => {
    expect(currentPeriodValue(logs, 'weekly', 'total', '2026-10-06')).toBe(600)
  })

  it('averages the window for average aggregation', () => {
    expect(currentPeriodValue(logs, 'weekly', 'average', '2026-10-06')).toBe(200)
  })

  it('excludes entries outside the 7-day window', () => {
    const result = currentPeriodValue(logs, 'weekly', 'total', '2026-10-06')
    expect(result).not.toBe(1600) // would include the 2026-09-29 entry if the window were wrong
  })

  it('returns null when nothing logged in the window', () => {
    expect(currentPeriodValue([], 'weekly', 'total', '2026-10-06')).toBeNull()
  })
})

describe('progressPct', () => {
  it('computes a percentage against target', () => {
    expect(progressPct(5000, 10000)).toBe(50)
  })
  it('clamps above 100', () => {
    expect(progressPct(15000, 10000)).toBe(100)
  })
  it('clamps below 0', () => {
    expect(progressPct(-5, 10000)).toBe(0)
  })
  it('returns null when there is no current value', () => {
    expect(progressPct(null, 10000)).toBeNull()
  })
  it('returns null when there is no target', () => {
    expect(progressPct(5000, null)).toBeNull()
  })
  it('returns null for a zero or negative target rather than dividing by zero', () => {
    expect(progressPct(5000, 0)).toBeNull()
  })
})

describe('isExpired', () => {
  it('is true once end_date has passed', () => {
    expect(isExpired('2026-10-01', '2026-10-06')).toBe(true)
  })
  it('is false for a future end_date', () => {
    expect(isExpired('2026-12-01', '2026-10-06')).toBe(false)
  })
  it('is false for an open-ended habit (no end_date)', () => {
    expect(isExpired(null, '2026-10-06')).toBe(false)
  })
})

describe('sleep minutes conversion', () => {
  it('splits total minutes into hours and minutes', () => {
    expect(minutesToHoursMinutes(450)).toEqual({ hours: 7, minutes: 30 })
  })
  it('combines hours and minutes into total minutes', () => {
    expect(hoursMinutesToMinutes(7, 30)).toBe(450)
  })
})

describe('formatMetricValue', () => {
  it('formats hours_minutes as "Xh Ym"', () => {
    expect(formatMetricValue(450, 'hours_minutes', 'h')).toBe('7h 30m')
  })
  it('omits minutes when exactly on the hour', () => {
    expect(formatMetricValue(420, 'hours_minutes', 'h')).toBe('7h')
  })
  it('formats a plain number with its unit', () => {
    expect(formatMetricValue(8000, 'number', 'steps')).toBe('8000 steps')
  })
})
