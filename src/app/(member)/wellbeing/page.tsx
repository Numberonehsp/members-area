import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import WellbeingPage from '@/components/wellbeing/WellbeingPage'

type Checkin = {
  id: string
  week_start: string
  energy: number
  sleep: number
  stress: number
  comments: string | null
}

async function getCheckins(memberId: string): Promise<Checkin[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data, error } = await supabase
    .from('wellbeing_checkins')
    .select('id, week_start, energy, sleep, stress, comments')
    .eq('gymmaster_member_id', memberId)
    .order('week_start', { ascending: false })
    .limit(12)

  if (error) {
    console.error('[wellbeing page] fetch error:', error.message)
    return []
  }

  return data ?? []
}

export default async function WellbeingPageRoute() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''

  const checkins = memberId ? await getCheckins(memberId) : []

  return <WellbeingPage checkins={checkins} />
}
