import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchHabitById, fetchHabitLogs, upsertHabitLog } from '@/lib/habit-queries'
import { fetchLogsInRange, fetchDayLogOrThrow, upsertDayLog } from '@/lib/nutrition-queries'
import { NUTRITION_METRICS, type HabitMetric } from '@/types/habits'
import { todayISO } from '@/lib/habit-logic'

type NutritionTotals = { calories: number; protein_g: number; carbs_g: number; fats_g: number }
type NutritionField = keyof NutritionTotals

function nutritionFieldForMetric(metric: HabitMetric): NutritionField {
  switch (metric) {
    case 'calories': return 'calories'
    case 'protein': return 'protein_g'
    case 'carbs': return 'carbs_g'
    case 'fat': return 'fats_g'
    // Unreachable today — only called after a NUTRITION_METRICS.has() check
    // covering exactly these 4 cases — but fail loudly rather than silently
    // writing to a wrong/undefined field if that set ever gains a 5th entry.
    default: throw new Error(`no nutrition mapping for metric ${metric}`)
  }
}

function nutritionValueForMetric(log: NutritionTotals, metric: HabitMetric): number {
  return log[nutritionFieldForMetric(metric)]
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
  // Bound the default end by the habit's own end_date — an archived habit's
  // history must stop where it stopped, not keep absorbing nutrition_logs
  // entries from after it ended (per the spec's [start_date, min(end_date,
  // today)] window). An explicit ?end= query param is still honored as-is.
  const defaultEnd = habit.end_date && habit.end_date < todayISO() ? habit.end_date : todayISO()
  const end = searchParams.get('end') ?? defaultEnd
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormat.test(start) || !dateFormat.test(end)) {
    return NextResponse.json({ error: 'start and end must be YYYY-MM-DD' }, { status: 400 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    // fetchLogsInRange throws on a DB error rather than returning [] — don't
    // let that look like "nothing logged this week" to the caller.
    // nutritionValueForMetric's default case can also throw (see its
    // comment) — covered by this same try/catch.
    let logs
    try {
      const nutritionLogs = await fetchLogsInRange(gymmaster_member_id, start, end)
      logs = nutritionLogs.map((l) => ({
        id: l.id,
        habit_id: habit.id,
        date: l.date,
        value: nutritionValueForMetric(l, habit.metric),
        updated_at: l.updated_at,
      }))
    } catch (err) {
      console.error('[habits logs GET] nutrition fetch failed:', err)
      return NextResponse.json({ error: 'Failed to load nutrition data' }, { status: 500 })
    }
    return NextResponse.json({ logs })
  }

  const habitLogs = await fetchHabitLogs(habit.id, start, end)
  return NextResponse.json({ logs: habitLogs })
}

// POST /api/habits/:id/logs — body: { date, value }. Upserts today's (or a
// backfilled past) entry. For a nutrition-category habit, this merges the
// single field into that day's nutrition_logs row (the same row the
// Nutrition page reads/writes) rather than a separate habit_logs row — one
// source of truth, with the Habit page as a second entry point onto it.
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
  if (habit.status !== 'active') {
    return NextResponse.json({ error: 'Cannot log a value for an ended habit' }, { status: 400 })
  }

  const body = await req.json()
  const { date, value } = body
  if (!date || typeof value !== 'number' || !isFinite(value)) {
    return NextResponse.json({ error: 'date and a finite numeric value are required' }, { status: 400 })
  }
  // Matches the DB's CHECK (value >= 0) on habit_logs, and mirrors the same
  // non-negativity expectation for a nutrition macro.
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
  if (habit.end_date && date > habit.end_date) {
    return NextResponse.json({ error: 'Cannot log a date after the habit ended' }, { status: 400 })
  }

  if (NUTRITION_METRICS.has(habit.metric)) {
    const field = nutritionFieldForMetric(habit.metric)
    let updated
    try {
      const existing = await fetchDayLogOrThrow(gymmaster_member_id, date)
      const totals: NutritionTotals = {
        calories: existing?.calories ?? 0,
        protein_g: existing?.protein_g ?? 0,
        carbs_g: existing?.carbs_g ?? 0,
        fats_g: existing?.fats_g ?? 0,
      }
      totals[field] = value
      updated = await upsertDayLog(gymmaster_member_id, date, totals)
    } catch (err) {
      console.error('[habits logs POST] failed to save nutrition value:', err)
      return NextResponse.json({ error: 'Failed to save value' }, { status: 500 })
    }
    const log = {
      id: updated.id,
      habit_id: habit.id,
      date: updated.date,
      value: nutritionValueForMetric(updated, habit.metric),
      updated_at: updated.updated_at,
    }
    return NextResponse.json({ log }, { status: 201 })
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
