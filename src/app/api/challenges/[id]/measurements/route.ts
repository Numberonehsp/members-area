import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: challengeId } = await params

  // Auth check — must be a logged-in member
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  // Expected: { participantId: string, measurements: { categoryId, entryType, value }[] }
  const { participantId, measurements } = body as {
    participantId: string
    measurements: { categoryId: string; entryType: string; value: number }[]
  }

  if (!participantId || !Array.isArray(measurements) || measurements.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Verify the participant belongs to this member + challenge
  const { data: participant, error: pErr } = await staffHubWriter
    .from('challenge_participants')
    .select('id')
    .eq('id', participantId)
    .eq('challenge_id', challengeId)
    .eq('gymmaster_member_id', gymMasterId)
    .maybeSingle()

  if (pErr || !participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 403 })
  }

  // Upsert each measurement — idempotent on (participant_id, category_id, entry_type)
  const rows = measurements.map(({ categoryId, entryType, value }) => ({
    participant_id: participantId,
    category_id: categoryId,
    entry_type: entryType,
    value,
    recorded_at: new Date().toISOString(),
  }))

  const { error } = await staffHubWriter
    .from('challenge_measurements')
    .upsert(rows, { onConflict: 'participant_id,category_id,entry_type' })

  if (error) {
    console.error('[measurements] upsert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
