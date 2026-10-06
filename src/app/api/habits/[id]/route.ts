import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchHabitById, updateHabit } from '@/lib/habit-queries'

// PUT — edit a habit's target/end_date, or archive it (body: { action: 'archive' }).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const existing = await fetchHabitById(gymmaster_member_id, id)
  if (!existing) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const body = await req.json()
  const update: { target?: number | null; end_date?: string | null; status?: 'active' | 'archived' } = {}
  if ('target' in body) update.target = body.target != null && body.target !== '' ? Number(body.target) : null
  if ('end_date' in body) update.end_date = body.end_date || null
  if (body.action === 'archive') update.status = 'archived'

  const habit = await updateHabit(gymmaster_member_id, id, update)
  return NextResponse.json({ habit })
}
