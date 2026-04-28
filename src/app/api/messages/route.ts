import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function membersAreaClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function getOrCreateThread(supabase: ReturnType<typeof membersAreaClient>, memberId: string) {
  // Look for existing thread for this member
  const { data: existing } = await supabase
    .from('message_threads')
    .select('id')
    .eq('gymmaster_member_id', memberId)
    .single()

  if (existing) return existing.id

  // Create a new thread
  const { data: created, error } = await supabase
    .from('message_threads')
    .insert({ gymmaster_member_id: memberId })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return created.id
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { body?: string; sender_role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { body: messageBody, sender_role } = body

  if (!messageBody?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  const role = sender_role === 'coach' ? 'coach' : 'member'
  const senderName = role === 'member'
    ? ([firstName, lastName].filter(Boolean).join(' ') || 'Member')
    : 'Coach'

  const supabase = membersAreaClient()

  let threadId: string
  try {
    threadId = await getOrCreateThread(supabase, memberId)
  } catch (err) {
    console.error('[messages POST] thread error:', err)
    return NextResponse.json({ error: 'Failed to get message thread' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_role: role,
      sender_name: senderName,
      body: messageBody.trim(),
      is_read: false,
    })
    .select('id, sender_role, sender_name, body, is_read, created_at')
    .single()

  if (error) {
    console.error('[messages POST] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  // Update thread's last_message_at
  await supabase
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId)

  return NextResponse.json({ message: data }, { status: 201 })
}
