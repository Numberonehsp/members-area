import { cookies } from 'next/headers'
import { fetchTargets, fetchDayLog, fetchWeekLogs, todayISO } from '@/lib/nutrition-queries'
import { DEFAULT_TARGETS } from '@/types/nutrition'
import NutritionPage from '@/components/nutrition/NutritionPage'

export default async function NutritionRoute() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''
  const today = todayISO()

  const yesterdayDate = (() => {
    const d = new Date(today + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  const [targets, log, yesterdayLog, weekDays] = await Promise.all([
    memberId ? fetchTargets(memberId) : Promise.resolve(null),
    memberId ? fetchDayLog(memberId, today) : Promise.resolve(null),
    memberId ? fetchDayLog(memberId, yesterdayDate) : Promise.resolve(null),
    memberId ? fetchWeekLogs(memberId) : Promise.resolve([]),
  ])

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
