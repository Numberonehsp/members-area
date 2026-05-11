import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import CoachTasksList from './CoachTasksList'

async function getPendingTasks(memberId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('member_tasks')
    .select('id, title, description, due_date, set_by')
    .eq('gymmaster_member_id', memberId)
    .is('completed_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(5)

  return data ?? []
}

export default async function CoachTasksPreview() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''

  if (!memberId) return null

  const tasks = await getPendingTasks(memberId)
  if (tasks.length === 0) return null

  return <CoachTasksList initialTasks={tasks} />
}
