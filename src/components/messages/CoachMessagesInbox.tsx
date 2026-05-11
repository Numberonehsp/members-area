'use client'

import { useState, useEffect, useCallback } from 'react'
import MessageThread from './MessageThread'
import type { Message } from './MessageThread'

type Thread = {
  id: string
  gymmaster_member_id: string
  member_name: string
  last_message_at: string | null
  last_message: string
  last_sender_role: 'member' | 'coach'
  unread_count: number
}

type BroadcastState = 'idle' | 'sending' | 'done' | 'error'

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CoachMessagesInbox() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Broadcast panel state
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastState, setBroadcastState] = useState<BroadcastState>('idle')
  const [broadcastResult, setBroadcastResult] = useState<string>('')

  const loadThreads = useCallback(async () => {
    const res = await fetch('/api/coach/messages')
    if (res.ok) {
      const { threads: data } = await res.json()
      setThreads(data ?? [])
    }
    setLoadingThreads(false)
  }, [])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  async function openThread(thread: Thread) {
    setActiveThreadId(thread.id)
    setLoadingMessages(true)

    const res = await fetch(`/api/coach/messages/${thread.id}`)
    if (res.ok) {
      const { messages } = await res.json()
      setThreadMessages(messages ?? [])
    }
    setLoadingMessages(false)

    // Clear unread badge locally
    setThreads(ts => ts.map(t => t.id === thread.id ? { ...t, unread_count: 0 } : t))
  }

  async function handleBroadcast() {
    if (!broadcastBody.trim() || threads.length === 0) return
    setBroadcastState('sending')

    const res = await fetch('/api/coach/messages/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymmaster_member_ids: threads.map(t => t.gymmaster_member_id),
        body: broadcastBody.trim(),
      }),
    })

    if (res.ok) {
      const { sent } = await res.json()
      setBroadcastState('done')
      setBroadcastResult(`Sent to ${sent} member${sent !== 1 ? 's' : ''}`)
      setBroadcastBody('')
      setTimeout(() => {
        setShowBroadcast(false)
        setBroadcastState('idle')
        setBroadcastResult('')
        loadThreads()
      }, 2000)
    } else {
      setBroadcastState('error')
      setBroadcastResult('Something went wrong — please try again')
    }
  }

  const activeThread = threads.find(t => t.id === activeThreadId)
  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
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
        <button
          onClick={() => setShowBroadcast(true)}
          className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          Broadcast
        </button>
      </div>

      {/* Broadcast panel */}
      {showBroadcast && (
        <div className="mb-4 shrink-0 bg-bg-card border border-brand/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Broadcast message</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Sends to all {threads.length} member{threads.length !== 1 ? 's' : ''} with existing conversations
              </p>
            </div>
            <button
              onClick={() => { setShowBroadcast(false); setBroadcastState('idle'); setBroadcastBody('') }}
              className="text-text-secondary hover:text-text-primary text-lg leading-none"
            >
              ×
            </button>
          </div>
          <textarea
            value={broadcastBody}
            onChange={e => setBroadcastBody(e.target.value)}
            rows={3}
            placeholder="Type your message to all members..."
            className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 resize-none mb-3"
          />
          <div className="flex items-center gap-3">
            <button
              disabled={!broadcastBody.trim() || broadcastState === 'sending' || threads.length === 0}
              onClick={handleBroadcast}
              className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {broadcastState === 'sending' ? 'Sending…' : `Send to ${threads.length} member${threads.length !== 1 ? 's' : ''}`}
            </button>
            {broadcastResult && (
              <p className={`text-sm ${broadcastState === 'error' ? 'text-red-500' : 'text-brand'}`}>
                {broadcastResult}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Thread list */}
        <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 shrink-0 bg-bg-card border border-border-light rounded-2xl overflow-hidden`}>
          <div className="p-3 border-b border-border-light">
            <p className="text-xs font-semibold text-text-secondary">
              {loadingThreads ? 'Loading…' : `${threads.length} conversation${threads.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border-light">
            {!loadingThreads && threads.length === 0 && (
              <div className="p-6 text-center text-text-secondary text-sm">
                No messages yet
              </div>
            )}
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => openThread(t)}
                className={`w-full text-left p-4 hover:bg-bg-main transition-colors ${activeThreadId === t.id ? 'bg-brand/5 border-r-2 border-brand' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`text-sm font-semibold ${t.unread_count > 0 ? 'text-text-primary' : 'text-text-primary/80'}`}>
                    {t.member_name}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.unread_count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                        {t.unread_count}
                      </span>
                    )}
                    <span className="text-[10px] text-text-secondary">{formatTime(t.last_message_at)}</span>
                  </div>
                </div>
                <p className={`text-xs truncate ${t.unread_count > 0 ? 'text-text-secondary font-medium' : 'text-text-secondary'}`}>
                  {t.last_sender_role === 'coach' ? 'You: ' : ''}{t.last_message}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Thread view */}
        {activeThread ? (
          <div className="flex-1 bg-bg-card border border-border-light rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-border-light flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveThreadId(null)}
                className="md:hidden text-text-secondary hover:text-text-primary"
              >
                ←
              </button>
              <div>
                <p className="text-sm font-semibold text-text-primary">{activeThread.member_name}</p>
                <p className="text-xs text-text-secondary">Member</p>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                  Loading messages…
                </div>
              ) : (
                <MessageThread
                  messages={threadMessages}
                  viewerRole="coach"
                  memberName={activeThread.member_name}
                  gymmaster_member_id={activeThread.gymmaster_member_id}
                />
              )}
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
