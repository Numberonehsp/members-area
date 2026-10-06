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
  // Number(body.target) silently becomes null for garbage input (NaN
  // serializes to null in the update body) — reject it instead of letting
  // it silently wipe a previously-valid target.
  if ('target' in body && body.target != null && body.target !== '' && !Number.isFinite(Number(body.target))) {
    return NextResponse.json({ error: 'target must be a number' }, { status: 400 })
  }
  // Matches the DB's CHECK (target IS NULL OR target > 0).
  if ('target' in body && body.target != null && body.target !== '' && Number(body.target) <= 0) {
    return NextResponse.json({ error: 'target must be greater than 0' }, { status: 400 })
  }
  const update: { target?: number | null; end_date?: string | null; status?: 'active' | 'archived' } = {}
  if ('target' in body) update.target = body.target != null && body.target !== '' ? Number(body.target) : null
  // Setting end_date alongside action:'archive' in one call is allowed —
  // nothing downstream reads end_date on an archived row, so there's
  // nothing to reconcile.
  if ('end_date' in body) update.end_date = body.end_date || null
  if (body.action === 'archive') update.status = 'archived'

  let habit
  try {
    habit = await updateHabit(gymmaster_member_id, id, update)
  } catch (err) {
    console.error('[habits PUT] failed to update habit:', err)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
  return NextResponse.json({ habit })
}
