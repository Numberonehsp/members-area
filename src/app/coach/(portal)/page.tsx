import { getAllMembers, type GymMasterMember } from '@/lib/gymmaster'
import { createClient } from '@supabase/supabase-js'
import CoachDashboardClient from './CoachDashboardClient'

export type MemberRow = GymMasterMember & {
  visitsThisMonth: number | null
  cacheUpdatedAt: string | null
}

async function getVisitCache(): Promise<Map<string, { visitsThisMonth: number; lastVisitDate: string | null; updatedAt: string }>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('member_visit_cache')
    .select('gymmaster_member_id, visits_this_month, last_visit_date, updated_at')

  const map = new Map<string, { visitsThisMonth: number; lastVisitDate: string | null; updatedAt: string }>()
  for (const row of data ?? []) {
    map.set(String(row.gymmaster_member_id), {
      visitsThisMonth: row.visits_this_month ?? 0,
      lastVisitDate: row.last_visit_date ?? null,
      updatedAt: row.updated_at,
    })
  }
  return map
}

function mergeWithCache(members: GymMasterMember[], cache: Awaited<ReturnType<typeof getVisitCache>>): MemberRow[] {
  return members.map((m) => {
    const cached = cache.get(m.id)
    return {
      ...m,
      lastVisitDate: cached?.lastVisitDate ?? m.lastVisitDate,
      visitsThisMonth: cached ? cached.visitsThisMonth : null,
      cacheUpdatedAt: cached?.updatedAt ?? null,
    }
  })
}

function getUpcomingBirthdays(members: GymMasterMember[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return members
    .filter((m) => m.dob)
    .map((m) => {
      const dob = new Date(m.dob!)
      const thisYear = today.getFullYear()
      let next = new Date(thisYear, dob.getMonth(), dob.getDate())
      if (next < today) next = new Date(thisYear + 1, dob.getMonth(), dob.getDate())
      const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000)
      const age = next.getFullYear() - dob.getFullYear()
      return { id: m.id, name: `${m.firstName} ${m.lastName}`, daysUntil, age }
    })
    .filter((b) => b.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export default async function CoachDashboardPage() {
  const [members, visitCache] = await Promise.all([
    getAllMembers(),
    getVisitCache(),
  ])

  const mergedMembers = mergeWithCache(members, visitCache)
  const upcomingBirthdays = getUpcomingBirthdays(members)

  return (
    <CoachDashboardClient
      members={mergedMembers}
      upcomingBirthdays={upcomingBirthdays}
      cachedMemberCount={visitCache.size}
    />
  )
}
