import { NextRequest, NextResponse } from 'next/server'
import { staffHubWriter, fetchRecentScans } from '@/lib/staffhub'

/** GET — recent scans across all members, for the coach portal table */
export async function GET() {
  const scans = await fetchRecentScans(30)
  return NextResponse.json({ scans })
}

/** POST — save a new InBody scan entered by a coach */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_id, member_name, scan_date, weight, smm, bf_pct, bf_mass, notes } = body

  if (!gymmaster_member_id || !scan_date) {
    return NextResponse.json({ error: 'gymmaster_member_id and scan_date are required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('inbody_scans')
    .upsert(
      {
        gymmaster_member_id,
        member_name: member_name || null,
        scan_date,
        weight: weight ?? null,
        smm: smm ?? null,
        bf_pct: bf_pct ?? null,
        bf_mass: bf_mass ?? null,
        notes: notes || null,
      },
      { onConflict: 'gymmaster_member_id,scan_date' }
    )

  if (error) {
    console.error('[InBody] Supabase save failed:', error)
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
