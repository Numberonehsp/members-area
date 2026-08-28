import { NextRequest, NextResponse } from 'next/server'
import { staffHubReader, staffHubWriter } from '@/lib/staffhub'

/** GET — recent strength results across all members, for the coach portal table */
export async function GET() {
  const { data, error } = await staffHubReader
    .from('strength_results')
    .select('id, gymmaster_member_id, member_name, exercise, result_value, result_notes, tested_date')
    .order('tested_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[coach/strength] fetch failed:', error.message)
    return NextResponse.json({ entries: [] })
  }

  return NextResponse.json({ entries: data ?? [] })
}

/** POST — coach enters one or more strength results on behalf of a member */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_id, member_name, tested_date, notes } = body

  if (!gymmaster_member_id || !tested_date) {
    return NextResponse.json(
      { error: 'gymmaster_member_id and tested_date are required' },
      { status: 400 },
    )
  }

  // Support both batch (entries array) and legacy single-exercise shape
  const entries: Array<{ exercise: string; result_value: number; exercise_notes?: string | null }> =
    Array.isArray(body.entries)
      ? body.entries
      : [{ exercise: body.exercise, result_value: body.result_value, exercise_notes: body.result_notes }]

  if (entries.length === 0 || entries.some((e) => !e.exercise || e.result_value == null)) {
    return NextResponse.json(
      { error: 'Each entry requires exercise and result_value' },
      { status: 400 },
    )
  }

  const rows = entries.map((e) => ({
    gymmaster_member_id,
    member_name: member_name || null,
    exercise: e.exercise,
    result_value: Number(e.result_value),
    result_notes: e.exercise_notes || notes || null,
    tested_date,
  }))

  const { error } = await staffHubWriter.from('strength_results').insert(rows)

  if (error) {
    console.error('[coach/strength] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** PATCH — coach edits an existing strength result by id */
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, exercise, result_value, result_notes, tested_date } = body

  if (!id || !exercise || result_value == null || !tested_date) {
    return NextResponse.json(
      { error: 'id, exercise, result_value and tested_date are required' },
      { status: 400 },
    )
  }

  const { error } = await staffHubWriter
    .from('strength_results')
    .update({
      exercise,
      result_value: Number(result_value),
      result_notes: result_notes || null,
      tested_date,
    })
    .eq('id', id)

  if (error) {
    console.error('[coach/strength] update failed:', error.message)
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE — remove a specific result row by id */
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await staffHubWriter.from('strength_results').delete().eq('id', id)

  if (error) {
    console.error('[coach/strength] delete failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
