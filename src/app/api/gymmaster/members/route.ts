import { NextResponse } from 'next/server'

const SITE_NAME = process.env.GYMMASTER_SITE_NAME ?? ''
const STAFF_API_KEY = process.env.GYMMASTER_STAFF_API_KEY ?? ''

export type GymMasterMemberSummary = {
  id: string
  name: string
}

export async function GET() {
  if (!SITE_NAME || !STAFF_API_KEY) {
    return NextResponse.json({ error: 'GymMaster credentials not configured' }, { status: 503 })
  }

  const res = await fetch(
    `https://${SITE_NAME}.gymmasteronline.com/portal/api/v1/members`,
    {
      headers: { 'Portal-API-Key': STAFF_API_KEY, Accept: 'application/json' },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `GymMaster API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()
  const all: Array<Record<string, unknown>> =
    Array.isArray(data) ? data : data.result ?? data.members ?? data.data ?? []

  const members: GymMasterMemberSummary[] = all
    .filter((m) => m.status === 'Current' && !m.isprospect)
    .map((m) => ({
      id: String(m.memberid ?? m.id ?? ''),
      name: [m.firstname, m.surname].filter(Boolean).join(' ') || String(m.name ?? 'Unknown'),
    }))
    .filter((m) => m.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ members })
}
