import { NextRequest, NextResponse } from 'next/server'
import { staffHubWriter, fetchRecentScans } from '@/lib/staffhub'

const SITE_NAME = process.env.GYMMASTER_SITE_NAME ?? ''
const STAFF_API_KEY = process.env.GYMMASTER_STAFF_API_KEY ?? ''

/** GET — recent scans across all members, for the coach portal table */
export async function GET() {
  const scans = await fetchRecentScans(30)
  return NextResponse.json({ scans })
}

/** POST — save a new InBody scan entered by a coach + push to GymMaster */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gymmaster_member_id, member_name, scan_date, weight, smm, bf_pct, bf_mass, notes } = body

  if (!gymmaster_member_id || !scan_date) {
    return NextResponse.json({ error: 'gymmaster_member_id and scan_date are required' }, { status: 400 })
  }

  // 1. Save to Supabase
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

  // 2. Push to GymMaster (best-effort — don't fail the request if GymMaster is down)
  if (SITE_NAME && STAFF_API_KEY) {
    try {
      const baseUrl = `https://${SITE_NAME}.gymmasteronline.com/portal/api/v2`
      const measurements = []

      // GymMaster measurement types (based on their v2 API):
      // Map our fields to their measurement type IDs
      if (weight != null) measurements.push({ measurement_type_id: 'weight', value: weight })
      if (smm != null) measurements.push({ measurement_type_id: 'smm', value: smm })
      if (bf_pct != null) measurements.push({ measurement_type_id: 'body_fat_percentage', value: bf_pct })
      if (bf_mass != null) measurements.push({ measurement_type_id: 'body_fat_mass', value: bf_mass })

      if (measurements.length > 0) {
        const res = await fetch(`${baseUrl}/member/${gymmaster_member_id}/measurements`, {
          method: 'POST',
          headers: {
            'Portal-API-Key': STAFF_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            measurement_date: scan_date,
            measurements,
            notes: notes || undefined,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          console.warn(`[InBody] GymMaster push failed: ${res.status} — ${text.slice(0, 200)}`)
          // Don't fail the request — data is safely in Supabase
        } else {
          console.log(`[InBody] GymMaster push OK for member ${gymmaster_member_id}`)
        }
      }
    } catch (err) {
      console.warn(`[InBody] GymMaster push threw:`, err)
      // Don't fail the request — data is safely in Supabase
    }
  }

  return NextResponse.json({ success: true })
}
