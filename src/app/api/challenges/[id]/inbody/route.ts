import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: challengeId } = await params

  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const {
    participantId,
    pre_weight_kg,
    pre_bf_pct,
    pre_fat_mass_kg,
    pre_smm_kg,
    post_weight_kg,
    post_bf_pct,
    post_fat_mass_kg,
    post_smm_kg,
  } = body

  if (!participantId) {
    return NextResponse.json({ error: 'participantId required' }, { status: 400 })
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

  // Only update fields that were provided (not null/undefined)
  function val(v: unknown) {
    if (v === null || v === undefined || v === '') return undefined
    const n = parseFloat(String(v))
    return isNaN(n) ? undefined : n
  }

  const update: Record<string, number> = {}
  const preWeight = val(pre_weight_kg); if (preWeight !== undefined) update.pre_weight_kg = preWeight
  const preBf = val(pre_bf_pct); if (preBf !== undefined) update.pre_body_fat_pct = preBf
  const preFat = val(pre_fat_mass_kg); if (preFat !== undefined) update.pre_fat_mass_kg = preFat
  const preSmm = val(pre_smm_kg); if (preSmm !== undefined) update.pre_smm_kg = preSmm
  const postWeight = val(post_weight_kg); if (postWeight !== undefined) update.post_weight_kg = postWeight
  const postBf = val(post_bf_pct); if (postBf !== undefined) update.post_body_fat_pct = postBf
  const postFat = val(post_fat_mass_kg); if (postFat !== undefined) update.post_fat_mass_kg = postFat
  const postSmm = val(post_smm_kg); if (postSmm !== undefined) update.post_smm_kg = postSmm

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, message: 'Nothing to update' })
  }

  const { error } = await staffHubWriter
    .from('challenge_participants')
    .update(update)
    .eq('id', participantId)

  if (error) {
    console.error('[inbody] update failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
