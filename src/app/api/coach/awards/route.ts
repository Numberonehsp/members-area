import { NextRequest, NextResponse } from 'next/server'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { award_type, member_name, gymmaster_member_id, month, reason } = body

  if (!award_type || !member_name || !month) {
    return NextResponse.json(
      { error: 'award_type, member_name and month are required' },
      { status: 400 },
    )
  }

  const VALID_TYPES = ['athlete_of_month', 'commitment_club', 'achievement']
  if (!VALID_TYPES.includes(award_type)) {
    return NextResponse.json({ error: `award_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('member_awards')
    .insert({
      award_type,
      member_name,
      month,
      reason: reason || null,
    })

  if (error) {
    console.error('[coach/awards] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
