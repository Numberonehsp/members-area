import { NextResponse } from 'next/server'
import { staffHubWriter } from '@/lib/staffhub'
import { getAllMembers } from '@/lib/gymmaster'

/**
 * POST /api/coach/backfill-names
 *
 * Fetches all GymMaster members and updates any rows in inbody_scans and
 * strength_results where member_name is NULL, matching on gymmaster_member_id.
 */
export async function POST() {
  try {
    const members = await getAllMembers()
    const nameMap = new Map(members.map(m => [m.id, `${m.firstName} ${m.lastName}`.trim()]))

    if (nameMap.size === 0) {
      return NextResponse.json({ error: 'Could not fetch GymMaster members' }, { status: 502 })
    }

    // Fetch all rows with null member_name from both tables
    const [scansRes, strengthRes] = await Promise.all([
      staffHubWriter
        .from('inbody_scans')
        .select('id, gymmaster_member_id')
        .is('member_name', null),
      staffHubWriter
        .from('strength_results')
        .select('id, gymmaster_member_id')
        .is('member_name', null),
    ])

    const scanUpdates = (scansRes.data ?? [])
      .filter(r => nameMap.has(String(r.gymmaster_member_id)))
      .map(r => ({ id: r.id, member_name: nameMap.get(String(r.gymmaster_member_id))! }))

    const strengthUpdates = (strengthRes.data ?? [])
      .filter(r => nameMap.has(String(r.gymmaster_member_id)))
      .map(r => ({ id: r.id, member_name: nameMap.get(String(r.gymmaster_member_id))! }))

    // Update in batches
    const updates = await Promise.all([
      ...scanUpdates.map(u =>
        staffHubWriter.from('inbody_scans').update({ member_name: u.member_name }).eq('id', u.id)
      ),
      ...strengthUpdates.map(u =>
        staffHubWriter.from('strength_results').update({ member_name: u.member_name }).eq('id', u.id)
      ),
    ])

    const errors = updates.filter(r => r.error).map(r => r.error!.message)

    return NextResponse.json({
      ok: true,
      scans_updated: scanUpdates.length,
      strength_updated: strengthUpdates.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[backfill-names] failed:', err)
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}
