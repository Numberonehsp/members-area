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

/** POST — coach enters a strength result on behalf of a member */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_id, member_name, exercise, result_value, result_notes, tested_date } = body

  if (!gymmaster_member_id || !exercise || result_value == null || !tested_date) {
    return NextResponse.json(
      { error: 'gymmaster_member_id, exercise, result_value and tested_date are required' },
      { status: 400 },
    )
  }

  const { error } = await staffHubWriter
    .from('strength_results')
    .insert({
      gymmaster_member_id,
      member_name: member_name || null,
      exercise,
      result_value: Number(result_value),
      result_notes: result_notes || null,
      tested_date,
    })

  if (error) {
    console.error('[coach/strength] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
