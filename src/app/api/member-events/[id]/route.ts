import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params

  // Only delete if the event belongs to this member
  const { error } = await staffHubWriter
    .from('member_events')
    .delete()
    .eq('id', id)
    .eq('gymmaster_member_id', memberId)

  if (error) {
    console.error('[member-events DELETE] error:', error.message)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
