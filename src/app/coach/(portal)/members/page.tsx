import { getAllMembers } from '@/lib/gymmaster'
import { createClient } from '@supabase/supabase-js'
import CoachMembersClient from './CoachMembersClient'
import type { MemberRow } from '../page'

async function getVisitCache() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('member_visit_cache')
    .select('gymmaster_member_id, visits_this_month, last_visit_date, updated_at')

  return new Map(
    (data ?? []).map((r) => [
      String(r.gymmaster_member_id),
      { visitsThisMonth: r.visits_this_month ?? 0, lastVisitDate: r.last_visit_date ?? null, updatedAt: r.updated_at },
    ])
  )
}

export default async function CoachMembersPage() {
  const [members, visitCache] = await Promise.all([getAllMembers(), getVisitCache()])

  const merged: MemberRow[] = members.map((m) => {
    const cached = visitCache.get(m.id)
    return {
      ...m,
      lastVisitDate: cached?.lastVisitDate ?? m.lastVisitDate,
      visitsThisMonth: cached ? cached.visitsThisMonth : null,
      cacheUpdatedAt: cached?.updatedAt ?? null,
    }
  })

  return <CoachMembersClient members={merged} />
}
