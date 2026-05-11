import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const supabase = db()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_role, sender_name, body, is_read, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[coach/messages/[threadId] GET] error:', error.message)
    return NextResponse.json({ messages: [] })
  }

  // Mark unread member messages as read now that the coach is viewing
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('thread_id', threadId)
    .eq('sender_role', 'member')
    .eq('is_read', false)

  return NextResponse.json({ messages: messages ?? [] })
}
