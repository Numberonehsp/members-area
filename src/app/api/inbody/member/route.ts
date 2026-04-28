import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

/** POST — member self-enters their own InBody scan */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { scan_date, weight, smm, bf_pct, bf_mass, notes } = body

  if (!scan_date) {
    return NextResponse.json({ error: 'scan_date is required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('inbody_scans')
    .upsert(
      {
        gymmaster_member_id: gymMasterId,
        scan_date,
        weight: weight ? Number(weight) : null,
        smm: smm ? Number(smm) : null,
        bf_pct: bf_pct ? Number(bf_pct) : null,
        bf_mass: bf_mass ? Number(bf_mass) : null,
        notes: notes || null,
      },
      { onConflict: 'gymmaster_member_id,scan_date' }
    )

  if (error) {
    console.error('[InBody] member save failed:', error)
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
