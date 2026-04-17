'use client'

import { useState } from 'react'
import MessageThread from './MessageThread'
import type { Message } from './MessageThread'

type Thread = {
  id: string
  memberId: string
  memberName: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  senderRole: 'member' | 'coach'
}

type Props = { threads: Thread[] }

// Seed messages per thread — TODO: load from Supabase when thread is selected
const SEED_THREAD_MESSAGES: Record<string, Message[]> = {
  t1: [
    { id: 'a1', sender_role: 'coach', sender_name: 'Coach Dan', body: "Sarah — just sent over your updated programme for the next block.", is_read: true, created_at: '2026-04-07T12:00:00Z' },
    { id: 'a2', sender_role: 'member', sender_name: 'Sarah Johnson', body: "Thanks for the programme update!", is_read: false, created_at: '2026-04-07T14:30:00Z' },
    { id: 'a3', sender_role: 'member', sender_name: 'Sarah Johnson', body: "Quick question — should I be doing the mobility work before or after the main session?", is_read: false, created_at: '2026-04-07T14:32:00Z' },
  ],
  t2: [
    { id: 'b1', sender_role: 'member', sender_name: 'Mike Thompson', body: "I'll be in Thursday instead of Wednesday this week.", is_read: false, created_at: '2026-04-07T09:15:00Z' },
  ],
  t3: [
    { id: 'c1', sender_role: 'member', sender_name: 'Emma Roberts', body: "Can I come in for an extra session Saturday morning?", is_read: true, created_at: '2026-04-05T14:00:00Z' },
    { id: 'c2', sender_role: 'coach', sender_name: 'Coach Dan', body: "Great, see you then!", is_read: true, created_at: '2026-04-05T16:00:00Z' },
  ],
  t4: [
    { id: 'd1', sender_role: 'member', sender_name: "James O'Brien", body: "My lower back has been a bit niggly this week.", is_read: false, created_at: '2026-04-04T11:20:00Z' },
  ],
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CoachMessagesInbox({ threads }: Props) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const activeThread = threads.find(t => t.id === activeThreadId)
  const activeMessages = activeThreadId ? (SEED_THREAD_MESSAGES[activeThreadId] ?? []) : []
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 shrink-0 flex items-baseline gap-3">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-1">Coach</p>
          <h1 className="font-display text-4xl text-text-primary leading-none">Messages</h1>
        </div>
        {totalUnread > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-brand text-white text-xs font-bold">
            {totalUnread} unread
          </span>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Thread list */}
        <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 shrink-0 bg-bg-card border border-border-light rounded-2xl overflow-hidden`}>
          <div className="p-3 border-b border-border-light">
            <p className="text-xs font-semibold text-text-secondary">{threads.length} conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border-light">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-4 hover:bg-bg-main transition-colors ${activeThreadId === t.id ? 'bg-brand/5 border-r-2 border-brand' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`text-sm font-semibold ${t.unreadCount > 0 ? 'text-text-primary' : 'text-text-primary/80'}`}>
                    {t.memberName}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                        {t.unreadCount}
                      </span>
                    )}
                    <span className="text-[10px] text-text-secondary">{formatTime(t.lastMessageAt)}</span>
                  </div>
                </div>
                <p className={`text-xs truncate ${t.unreadCount > 0 ? 'text-text-secondary font-medium' : 'text-text-secondary'}`}>
                  {t.senderRole === 'coach' ? 'You: ' : ''}{t.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Thread view */}
        {activeThread ? (
          <div className="flex-1 bg-bg-card border border-border-light rounded-2xl overflow-hidden flex flex-col min-h-0">
            {/* Thread header */}
            <div className="p-4 border-b border-border-light flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveThreadId(null)}
                className="md:hidden text-text-secondary hover:text-text-primary"
              >
                ←
              </button>
              <div>
                <p className="text-sm font-semibold text-text-primary">{activeThread.memberName}</p>
                <p className="text-xs text-text-secondary">Member</p>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MessageThread
                messages={activeMessages}
                viewerRole="coach"
                memberName={activeThread.memberName}
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 bg-bg-card border border-border-light rounded-2xl items-center justify-center text-text-secondary text-sm flex-col gap-2">
            <span className="text-3xl">💬</span>
            <p>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
