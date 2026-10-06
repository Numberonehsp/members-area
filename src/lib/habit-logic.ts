// Pure habit math — cadence/aggregation rollup, progress calculation, sleep
// minutes conversion. No DB, no fetch, no React — the API routes and
// components call this and the Supabase helpers in src/lib/habit-queries.ts
// separately, same split as the sibling staff-hub repo's
// src/lib/reminderEligibility.ts.

import type { HabitCadence, HabitAggregation } from '@/types/habits'

export type HabitLogEntry = { date: string; value: number }

/** Shared by HabitsClient.tsx and HabitDetailModal.tsx — kept in one place so they can't drift. */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function canAddHabit(activeCount: number, maxActive: number): boolean {
  return activeCount < maxActive
}

/**
 * Rolls daily log entries up into the single number a habit's progress is
 * measured against. 'daily' cadence just looks up today's entry. 'weekly'
 * cadence sums or averages the 7-day window ending `today` (inclusive).
 */
export function currentPeriodValue(
  logs: HabitLogEntry[],
  cadence: HabitCadence,
  aggregation: HabitAggregation | null,
  today: string
): number | null {
  if (cadence === 'daily') {
    const entry = logs.find((l) => l.date === today)
    return entry ? entry.value : null
  }

  const end = new Date(`${today}T00:00:00Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  const startISO = start.toISOString().slice(0, 10)

  const windowLogs = logs.filter((l) => l.date >= startISO && l.date <= today)
  if (windowLogs.length === 0) return null

  const sum = windowLogs.reduce((acc, l) => acc + l.value, 0)
  return aggregation === 'average' ? sum / windowLogs.length : sum
}

export function progressPct(current: number | null, target: number | null): number | null {
  if (current == null || target == null || target <= 0) return null
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

export function isExpired(endDate: string | null, today: string): boolean {
  return endDate != null && endDate < today
}

/** Sleep is logged/targeted as total minutes; this splits it for the h/m input pair. */
export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

export function hoursMinutesToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

export function formatMetricValue(
  value: number,
  inputKind: 'number' | 'hours_minutes',
  unit: string
): string {
  if (inputKind === 'hours_minutes') {
    const { hours, minutes } = minutesToHoursMinutes(Math.round(value))
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  // A weekly average (e.g. 2000/7) can carry a long float tail — round to
  // one decimal place so it never renders as e.g. "914.2857142857143 steps".
  const rounded = Math.round(value * 10) / 10
  return `${rounded} ${unit}`
}
