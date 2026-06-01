import { createClient } from '@supabase/supabase-js'

export type PendingTask = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  set_by: string
}

/** Formats a due date as a human-readable label with overdue flag. */
export function formatDueDate(
  dateStr: string | null,
): { label: string; overdue: boolean } | null {
  if (!dateStr) return null
  const due = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false }
  return {
    label: `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    overdue: false,
  }
}

/**
 * Fetch pending (incomplete) tasks for a member.
 * Uses Members Area Supabase anon key — server-side only.
 */
export async function getPendingTasks(memberId: string): Promise<PendingTask[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!memberId || !url || !key) return []
  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('member_tasks')
      .select('id, title, description, due_date, set_by')
      .eq('gymmaster_member_id', memberId)
      .is('completed_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10)
    if (error) {
      console.warn('[tasks] getPendingTasks failed:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn('[tasks] getPendingTasks threw:', err)
    return []
  }
}
