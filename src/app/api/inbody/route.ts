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

/** DELETE — coach removes any InBody scan by id */
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await staffHubWriter.from('inbody_scans').delete().eq('id', id)

  if (error) {
    console.error('[InBody] delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/** PATCH — coach edits an existing InBody scan by id */
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, scan_date, weight, smm, bf_pct, bf_mass, notes } = body

  if (!id || !scan_date) {
    return NextResponse.json({ error: 'id and scan_date are required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('inbody_scans')
    .update({
      scan_date,
      weight: weight ?? null,
      smm: smm ?? null,
      bf_pct: bf_pct ?? null,
      bf_mass: bf_mass ?? null,
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    // Unique (gymmaster_member_id, scan_date) collision
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A scan already exists for that date' },
        { status: 409 },
      )
    }
    console.error('[InBody] update failed:', error)
    return NextResponse.json({ error: 'Failed to update scan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
