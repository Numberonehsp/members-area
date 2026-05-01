import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(req: NextRequest) {
  // Auth check — must be a logged-in member
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { nomineeName, reason } = body as { nomineeName: string; reason: string }

  if (!nomineeName?.trim()) {
    return NextResponse.json({ error: 'Nominee name is required' }, { status: 400 })
  }

  // Current month in YYYY-MM format
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const nominatorName = [firstName, lastName].filter(Boolean).join(' ') || null

  const { error } = await staffHubWriter.from('award_nominations').insert({
    gymmaster_member_id: gymMasterId,
    nominator_name: nominatorName,
    nominee_name: nomineeName.trim(),
    reason: reason?.trim() || null,
    month,
  })

  if (error) {
    console.error('[nominations] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
