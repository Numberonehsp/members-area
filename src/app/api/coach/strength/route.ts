import { NextRequest, NextResponse } from 'next/server'
import { staffHubWriter } from '@/lib/staffhub'

type StrengthEntry = {
  exercise_name: string
  value: number
  unit: string
  higher_is_better: boolean
  exercise_notes: string | null
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    gymmaster_member_id,
    member_name,
    test_date,
    testing_block,
    notes,
    entries,
  } = body as {
    gymmaster_member_id: string
    member_name: string
    test_date: string
    testing_block: string
    notes: string | null
    entries: StrengthEntry[]
  }

  if (!gymmaster_member_id || !test_date || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: 'gymmaster_member_id, test_date and entries are required' },
      { status: 400 },
    )
  }

  const rows = entries.map((e) => ({
    gymmaster_member_id,
    member_name: member_name || null,
    exercise: e.exercise_name,
    result_value: e.value,
    result_notes: e.exercise_notes || notes || null,
    tested_date: test_date,
    testing_block: testing_block || null,
  }))

  const { error } = await staffHubWriter
    .from('strength_results')
    .insert(rows)

  if (error) {
    console.error('[coach/strength] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
