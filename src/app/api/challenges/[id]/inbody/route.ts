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
  const memberName = [
    cookieStore.get('gymmaster_first_name')?.value,
    cookieStore.get('gymmaster_last_name')?.value,
  ].filter(Boolean).join(' ') || null

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

  // Verify the participant belongs to this member + challenge, and fetch challenge dates
  const { data: participant, error: pErr } = await staffHubWriter
    .from('challenge_participants')
    .select('id, challenges(start_date, end_date)')
    .eq('id', participantId)
    .eq('challenge_id', challengeId)
    .eq('gymmaster_member_id', gymMasterId)
    .maybeSingle()

  if (pErr || !participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 403 })
  }

  const challenge = (participant as any).challenges?.[0]

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

  // Update challenge_participants
  const { error } = await staffHubWriter
    .from('challenge_participants')
    .update(update)
    .eq('id', participantId)

  if (error) {
    console.error('[inbody] update failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also mirror pre/post values to inbody_scans so they appear in Results > Body Composition
  if (challenge) {
    const scanUpserts: Array<{
      gymmaster_member_id: string
      scan_date: string
      weight: number | null
      bf_pct: number | null
      bf_mass: number | null
      smm: number | null
      member_name: string | null
      notes: string | null
    }> = []

    // Pre scan → challenge start_date
    const hasPreValues = preWeight !== undefined || preBf !== undefined || preFat !== undefined || preSmm !== undefined
    if (hasPreValues && challenge.start_date) {
      scanUpserts.push({
        gymmaster_member_id: gymMasterId,
        scan_date: challenge.start_date,
        weight: preWeight ?? null,
        bf_pct: preBf ?? null,
        bf_mass: preFat ?? null,
        smm: preSmm ?? null,
        member_name: memberName,
        notes: 'Challenge pre-scan (auto-linked)',
      })
    }

    // Post scan → challenge end_date
    const hasPostValues = postWeight !== undefined || postBf !== undefined || postFat !== undefined || postSmm !== undefined
    if (hasPostValues && challenge.end_date) {
      scanUpserts.push({
        gymmaster_member_id: gymMasterId,
        scan_date: challenge.end_date,
        weight: postWeight ?? null,
        bf_pct: postBf ?? null,
        bf_mass: postFat ?? null,
        smm: postSmm ?? null,
        member_name: memberName,
        notes: 'Challenge post-scan (auto-linked)',
      })
    }

    for (const scanData of scanUpserts) {
      const { error: scanErr } = await staffHubWriter
        .from('inbody_scans')
        .upsert(scanData, { onConflict: 'gymmaster_member_id,scan_date' })
      if (scanErr) {
        console.warn('[inbody] inbody_scans upsert failed:', scanErr.message)
        // Non-fatal — challenge data was saved successfully
      }
    }
  }

  return NextResponse.json({ ok: true })
}
