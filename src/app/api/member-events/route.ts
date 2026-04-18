import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

const MAX_EVENTS = 3

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { event_name?: string; event_date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event_name, event_date } = body
  if (!event_name?.trim() || !event_date) {
    return NextResponse.json({ error: 'event_name and event_date are required' }, { status: 400 })
  }

  // Enforce 3-event cap
  const { count, error: countError } = await staffHubWriter
    .from('member_events')
    .select('id', { count: 'exact', head: true })
    .eq('gymmaster_member_id', memberId)

  if (countError) {
    console.error('[member-events POST] count error:', countError.message)
    return NextResponse.json({ error: 'Failed to check event count' }, { status: 500 })
  }

  if ((count ?? 0) >= MAX_EVENTS) {
    return NextResponse.json({ error: `Maximum ${MAX_EVENTS} events allowed` }, { status: 422 })
  }

  const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Member'

  const { data, error } = await staffHubWriter
    .from('member_events')
    .insert({
      gymmaster_member_id: memberId,
      member_name: memberName,
      event_name: event_name.trim(),
      event_date,
    })
    .select('id, gymmaster_member_id, member_name, event_name, event_date, created_at')
    .single()

  if (error) {
    console.error('[member-events POST] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
