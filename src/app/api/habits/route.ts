import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  fetchHabits,
  countActiveHabits,
  hasActiveHabitForMetric,
  createHabit,
  archiveExpiredHabits,
} from '@/lib/habit-queries'
import { METRIC_CONFIG, MAX_ACTIVE_HABITS, type HabitMetric } from '@/types/habits'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// GET — list the member's active and archived habits.
export async function GET() {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await archiveExpiredHabits(gymmaster_member_id, todayISO())

  const [active, archived] = await Promise.all([
    fetchHabits(gymmaster_member_id, 'active'),
    fetchHabits(gymmaster_member_id, 'archived'),
  ])

  return NextResponse.json({ active, archived })
}

// POST — add a new habit. metric/category/cadence/aggregation are always
// validated server-side against METRIC_CONFIG — never trust the client for
// which category a metric belongs to.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { metric, target, cadence, aggregation, start_date, end_date } = body

  const config = METRIC_CONFIG[metric as HabitMetric]
  if (!config) {
    return NextResponse.json({ error: 'Unknown metric' }, { status: 400 })
  }
  if (cadence !== 'daily' && cadence !== 'weekly') {
    return NextResponse.json({ error: 'cadence must be daily or weekly' }, { status: 400 })
  }
  if (cadence === 'weekly' && aggregation !== 'total' && aggregation !== 'average') {
    return NextResponse.json({ error: 'aggregation must be total or average for a weekly habit' }, { status: 400 })
  }
  if (!start_date) {
    return NextResponse.json({ error: 'start_date is required' }, { status: 400 })
  }

  // countActiveHabits/hasActiveHabitForMetric throw on a DB error rather
  // than returning 0/false — don't let a failed check silently pass.
  let activeCount: number
  let alreadyTracking: boolean
  try {
    activeCount = await countActiveHabits(gymmaster_member_id)
    alreadyTracking = await hasActiveHabitForMetric(gymmaster_member_id, metric)
  } catch (err) {
    console.error('[habits POST] failed to check existing habits:', err)
    return NextResponse.json({ error: 'Failed to check existing habits' }, { status: 500 })
  }

  if (activeCount >= MAX_ACTIVE_HABITS) {
    return NextResponse.json({ error: `Maximum ${MAX_ACTIVE_HABITS} active habits allowed` }, { status: 422 })
  }

  if (alreadyTracking) {
    return NextResponse.json({ error: 'This habit is already active' }, { status: 422 })
  }

  const habit = await createHabit(gymmaster_member_id, {
    metric,
    category: config.category,
    target: target != null && target !== '' ? Number(target) : null,
    cadence,
    aggregation: cadence === 'weekly' ? aggregation : null,
    start_date,
    end_date: end_date || null,
  })

  return NextResponse.json({ habit }, { status: 201 })
}
