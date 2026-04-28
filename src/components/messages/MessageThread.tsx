'use client'

import { useState, useRef, useEffect } from 'react'

export type Message = {
  id: string
  sender_role: 'member' | 'coach'
  sender_name: string
  body: string
  is_read: boolean
  created_at: string
}

type Props = {
  messages: Message[]
  viewerRole: 'member' | 'coach'
  threadId?: string
  memberName?: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function MessageThread({ messages: initialMessages, viewerRole, memberName }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)

    const text = body.trim()

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_role: viewerRole,
      sender_name: viewerRole === 'coach' ? 'Coach' : 'You',
      body: text,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(m => [...m, optimistic])
    setBody('')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, sender_role: viewerRole }),
    })

    if (res.ok) {
      const { message } = await res.json()
      // Replace optimistic message with the saved one (has real id and created_at)
      setMessages(m => m.map(msg => msg.id === optimistic.id ? message : msg))
    } else {
      // Roll back on failure
      setMessages(m => m.filter(msg => msg.id !== optimistic.id))
      setBody(text)
    }

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary text-sm gap-2">
            <span className="text-3xl">💬</span>
            <p>No messages yet — say hello!</p>
          </div>
        )}
        {messages.map(m => {
          const isOwn = m.sender_role === viewerRole
          return (
            <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                  <p className="text-[10px] text-text-secondary px-1">{m.sender_name}</p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-brand text-white rounded-br-sm'
                    : 'bg-bg-card border border-border-light text-text-primary rounded-bl-sm'
                }`}>
                  {m.body}
                </div>
                <p className="text-[10px] text-text-secondary px-1">{formatTime(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border-light p-3 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={`Message ${viewerRole === 'member' ? 'your coach' : memberName ?? 'member'}...`}
          className="flex-1 bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50 resize-none"
        />
        <button
          disabled={!body.trim() || sending}
          onClick={handleSend}
          className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 rotate-90">
            <path d="M2 21L23 12 2 3v7l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
