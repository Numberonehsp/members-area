import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

async function getCoachUnreadCount(memberId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: thread } = await supabase
    .from('message_threads')
    .select('id')
    .eq('gymmaster_member_id', memberId)
    .maybeSingle()

  if (!thread) return 0

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', thread.id)
    .eq('sender_role', 'coach')
    .eq('is_read', false)

  return count ?? 0
}

export default async function MessageNotification({ gymMasterId }: { gymMasterId: string }) {
  if (!gymMasterId || gymMasterId === 'DEMO') return null

  const unread = await getCoachUnreadCount(gymMasterId)
  if (unread === 0) return null

  return (
    <Link href="/messages" className="block mb-6">
      <div className="rounded-xl px-5 py-4 bg-brand text-white flex items-center gap-4 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {unread === 1 ? 'New message from your coach' : `${unread} new messages from your coach`}
          </p>
          <p className="text-white/75 text-xs mt-0.5">Tap to view and reply</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-white text-brand text-xs font-bold flex items-center justify-center">
            {unread}
          </span>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/70">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
