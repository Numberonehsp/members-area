import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchHabitById, fetchHabitLogs, upsertHabitLog } from '@/lib/habit-queries'
import { fetchLogsInRange } from '@/lib/nutrition-queries'
import { NUTRITION_METRICS, type HabitMetric } from '@/types/habits'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function nutritionValueForMetric(
  log: { calories: number; protein_g: number; carbs_g: number; fats_g: number },
  metric: HabitMetric
): number {
  switch (metric) {
    case 'calories': return log.calories
    case 'protein': return log.protein_g
    case 'carbs': return log.carbs_g
    case 'fat': return log.fats_g
    default: return 0
  }
}

// GET /api/habits/:id/logs?start=&end= — defaults to the habit's full period.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const habit = await fetchHabitById(gymmaster_member_id, id)
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') ?? habit.start_date
  const end = searchParams.get('end') ?? todayISO()
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormat.test(start) || !dateFormat.test(end)) {
    return NextResponse.json({ error: 'start and end must be YYYY-MM-DD' }, { status: 400 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    // fetchLogsInRange throws on a DB error rather than returning [] — don't
    // let that look like "nothing logged this week" to the caller.
    let nutritionLogs
    try {
      nutritionLogs = await fetchLogsInRange(gymmaster_member_id, start, end)
    } catch (err) {
      console.error('[habits logs GET] nutrition fetch failed:', err)
      return NextResponse.json({ error: 'Failed to load nutrition data' }, { status: 500 })
    }
    const logs = nutritionLogs.map((l) => ({
      id: l.id,
      habit_id: habit.id,
      date: l.date,
      value: nutritionValueForMetric(l, habit.metric),
      updated_at: l.updated_at,
    }))
    return NextResponse.json({ logs })
  }

  const logs = await fetchHabitLogs(habit.id, start, end)
  return NextResponse.json({ logs })
}

// POST /api/habits/:id/logs — body: { date, value }. Upserts today's (or a
// backfilled past) entry. Rejected for nutrition-category habits.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const habit = await fetchHabitById(gymmaster_member_id, id)
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    return NextResponse.json({ error: 'Nutrition habits are logged from the Nutrition page' }, { status: 400 })
  }

  const body = await req.json()
  const { date, value } = body
  if (!date || typeof value !== 'number' || !isFinite(value)) {
    return NextResponse.json({ error: 'date and a finite numeric value are required' }, { status: 400 })
  }
  // Matches the DB's CHECK (value >= 0) on habit_logs — reject here with a
  // clear message rather than letting that constraint throw an unhandled DB error.
  if (value < 0) {
    return NextResponse.json({ error: 'value cannot be negative' }, { status: 400 })
  }
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormat.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }
  if (date > todayISO()) {
    return NextResponse.json({ error: 'Cannot log a future date' }, { status: 400 })
  }
  if (date < habit.start_date) {
    return NextResponse.json({ error: 'Cannot log a date before the habit started' }, { status: 400 })
  }

  let log
  try {
    log = await upsertHabitLog(habit.id, date, value)
  } catch (err) {
    console.error('[habits logs POST] failed to save log:', err)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
  return NextResponse.json({ log }, { status: 201 })
}
