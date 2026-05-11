import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * POST /api/coach/messages/broadcast
 * Sends a message from the coach to multiple members.
 * Body: { gymmaster_member_ids: string[], body: string, coach_name?: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_ids, body: messageBody, coach_name } = body

  if (!Array.isArray(gymmaster_member_ids) || gymmaster_member_ids.length === 0 || !messageBody?.trim()) {
    return NextResponse.json(
      { error: 'gymmaster_member_ids (array) and body are required' },
      { status: 400 }
    )
  }

  const supabase = db()
  const senderName = coach_name?.trim() || 'Coach'
  const text = messageBody.trim()
  const now = new Date().toISOString()
  let sent = 0

  for (const memberId of gymmaster_member_ids) {
    // Get or create thread
    let threadId: string
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('gymmaster_member_id', memberId)
      .maybeSingle()

    if (existing) {
      threadId = existing.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('message_threads')
        .insert({ gymmaster_member_id: memberId })
        .select('id')
        .single()

      if (createErr || !created) continue
      threadId = created.id
    }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_role: 'coach',
        sender_name: senderName,
        body: text,
        is_read: false,
      })

    if (msgErr) {
      console.error(`[broadcast] insert failed for member ${memberId}:`, msgErr.message)
      continue
    }

    await supabase
      .from('message_threads')
      .update({ last_message_at: now })
      .eq('id', threadId)

    sent++
  }

  return NextResponse.json({ sent })
}
