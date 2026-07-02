import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchTargets, fetchDayLog, fetchWeekLogs, todayISO } from '@/lib/nutrition-queries'
import { DEFAULT_TARGETS } from '@/types/nutrition'
import type { WeekDay } from '@/types/nutrition'
import NutritionPage from '@/components/nutrition/NutritionPage'

export default async function NutritionRoute() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  if (!memberId) redirect('/login')
  const today = todayISO()

  const yesterdayDate = (() => {
    const d = new Date(today + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  let targets = null
  let log = null
  let yesterdayLog = null
  let weekDays: WeekDay[] = []

  try {
    ;[targets, log, yesterdayLog, weekDays] = await Promise.all([
      fetchTargets(memberId),
      fetchDayLog(memberId, today),
      fetchDayLog(memberId, yesterdayDate),
      fetchWeekLogs(memberId),
    ])
  } catch {
    // silently degrade — page renders with defaults
  }

  return (
    <NutritionPage
      initialLog={log}
      yesterdayLog={yesterdayLog}
      targets={targets ?? DEFAULT_TARGETS}
      weekDays={weekDays}
      today={today}
    />
  )
}
