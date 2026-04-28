import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import MessageThread from '@/components/messages/MessageThread'
import type { Message } from '@/components/messages/MessageThread'

async function getMessages(memberId: string): Promise<Message[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Find thread for this member
  const { data: thread } = await supabase
    .from('message_threads')
    .select('id')
    .eq('gymmaster_member_id', memberId)
    .single()

  if (!thread) return []

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_role, sender_name, body, is_read, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[messages page] fetch error:', error.message)
    return []
  }

  return data ?? []
}

export default async function MemberMessagesPage() {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value ?? ''

  const messages = memberId ? await getMessages(memberId) : []

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Direct</p>
        <h1 className="font-display text-4xl text-text-primary leading-none">
          Messages
        </h1>
        <p className="text-text-secondary text-xs mt-1">Your conversation with the Number One HSP coaching team</p>
      </div>

      {/* Thread */}
      <div className="flex-1 bg-bg-card border border-border-light rounded-2xl overflow-hidden min-h-0">
        <MessageThread
          messages={messages}
          viewerRole="member"
        />
      </div>
    </div>
  )
}
