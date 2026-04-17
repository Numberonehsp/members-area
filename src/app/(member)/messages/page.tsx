import MessageThread from '@/components/messages/MessageThread'
import type { Message } from '@/components/messages/MessageThread'

// TODO: replace with Supabase query for logged-in member's thread
// const { data: messages } = await supabase
//   .from('messages')
//   .select('*')
//   .eq('thread_id', memberThread.id)
//   .order('created_at', { ascending: true })

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender_role: 'coach',
    sender_name: 'Coach Dan',
    body: "Hey! Great session last Tuesday — your hip hinge is really coming together. How are you feeling after it?",
    is_read: true,
    created_at: '2026-04-06T10:15:00Z',
  },
  {
    id: 'm2',
    sender_role: 'member',
    sender_name: 'You',
    body: "Thanks! Yeah I felt that one the next day 😄 Glutes were properly sore. Really enjoying the programme.",
    is_read: true,
    created_at: '2026-04-06T11:42:00Z',
  },
  {
    id: 'm3',
    sender_role: 'coach',
    sender_name: 'Coach Dan',
    body: "That's the sign of a good session! We'll push the hinge a bit more this week. Also — make sure you're hitting your protein targets, it'll make a big difference to recovery.",
    is_read: true,
    created_at: '2026-04-07T09:00:00Z',
  },
]

export default function MemberMessagesPage() {
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
          messages={SEED_MESSAGES}
          viewerRole="member"
        />
      </div>
    </div>
  )
}
