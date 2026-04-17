import CoachMessagesInbox from '@/components/messages/CoachMessagesInbox'

// TODO: replace with Supabase query
// const { data: threads } = await supabase
//   .from('message_threads')
//   .select('*, member:members(first_name, last_name, avatar_url), messages(body, created_at, is_read, sender_role)')
//   .order('last_message_at', { ascending: false })

const SEED_THREADS = [
  {
    id: 't1',
    memberId: 'm1',
    memberName: 'Sarah Johnson',
    lastMessage: 'Thanks for the programme update!',
    lastMessageAt: '2026-04-07T14:30:00Z',
    unreadCount: 2,
    senderRole: 'member' as const,
  },
  {
    id: 't2',
    memberId: 'm2',
    memberName: 'Mike Thompson',
    lastMessage: "I'll be in Thursday instead of Wednesday this week.",
    lastMessageAt: '2026-04-07T09:15:00Z',
    unreadCount: 1,
    senderRole: 'member' as const,
  },
  {
    id: 't3',
    memberId: 'm3',
    memberName: 'Emma Roberts',
    lastMessage: "Great, see you then!",
    lastMessageAt: '2026-04-05T16:00:00Z',
    unreadCount: 0,
    senderRole: 'coach' as const,
  },
  {
    id: 't4',
    memberId: 'm4',
    memberName: 'James O\'Brien',
    lastMessage: 'My lower back has been a bit niggly this week.',
    lastMessageAt: '2026-04-04T11:20:00Z',
    unreadCount: 1,
    senderRole: 'member' as const,
  },
]

export default function CoachMessagesPage() {
  return <CoachMessagesInbox threads={SEED_THREADS} />
}
