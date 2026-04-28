import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { exercise, result_value, result_notes, tested_date } = body

  if (!exercise || result_value == null || !tested_date) {
    return NextResponse.json({ error: 'exercise, result_value and tested_date are required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('strength_results')
    .insert({
      gymmaster_member_id: gymMasterId,
      exercise,
      result_value: Number(result_value),
      result_notes: result_notes || null,
      tested_date,
    })

  if (error) {
    console.error('[Strength] insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
