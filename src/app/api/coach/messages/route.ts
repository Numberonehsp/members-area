import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * GET /api/coach/messages
 * Returns all message threads with the last message and unread count.
 */
export async function GET() {
  const supabase = db()

  const { data: threads, error } = await supabase
    .from('message_threads')
    .select('id, gymmaster_member_id, member_name, last_message_at, created_at')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[coach/messages GET] threads error:', error.message)
    return NextResponse.json({ threads: [] })
  }

  if (!threads || threads.length === 0) {
    return NextResponse.json({ threads: [] })
  }

  // For each thread, fetch the last message and unread count
  const enriched = await Promise.all(
    threads.map(async (t) => {
      const [lastMsgRes, unreadRes] = await Promise.all([
        supabase
          .from('messages')
          .select('body, sender_role, created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', t.id)
          .eq('is_read', false)
          .eq('sender_role', 'member'),
      ])

      return {
        id: t.id,
        gymmaster_member_id: t.gymmaster_member_id,
        member_name: t.member_name ?? `Member ${t.gymmaster_member_id}`,
        last_message_at: t.last_message_at,
        last_message: lastMsgRes.data?.body ?? '',
        last_sender_role: lastMsgRes.data?.sender_role ?? 'member',
        unread_count: unreadRes.count ?? 0,
      }
    })
  )

  return NextResponse.json({ threads: enriched })
}

/**
 * POST /api/coach/messages
 * Coach sends a message to a specific member's thread.
 * Body: { gymmaster_member_id: string, body: string, coach_name?: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_id, body: messageBody, coach_name } = body

  if (!gymmaster_member_id || !messageBody?.trim()) {
    return NextResponse.json({ error: 'gymmaster_member_id and body are required' }, { status: 400 })
  }

  const supabase = db()
  const senderName = coach_name?.trim() || 'Coach'
  const memberName = body.member_name?.trim() || null

  // Get or create thread
  let threadId: string
  const { data: existing } = await supabase
    .from('message_threads')
    .select('id')
    .eq('gymmaster_member_id', gymmaster_member_id)
    .maybeSingle()

  if (existing) {
    threadId = existing.id
  } else {
    const { data: created, error: createErr } = await supabase
      .from('message_threads')
      .insert({ gymmaster_member_id, member_name: memberName })
      .select('id')
      .single()

    if (createErr || !created) {
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }
    threadId = created.id
  }

  const { data: message, error: msgErr } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_role: 'coach',
      sender_name: senderName,
      body: messageBody.trim(),
      is_read: false,
    })
    .select('id, sender_role, sender_name, body, is_read, created_at')
    .single()

  if (msgErr || !message) {
    console.error('[coach/messages POST] insert error:', msgErr?.message)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  await supabase
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId)

  return NextResponse.json({ message, thread_id: threadId }, { status: 201 })
}
