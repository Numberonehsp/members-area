import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(request: NextRequest) {
  // Get member identity from cookies set at login
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { challengeId } = body

  if (!challengeId) {
    return NextResponse.json({ error: 'challengeId required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('challenge_signups')
    .insert({
      challenge_id: challengeId,
      gymmaster_member_id: gymMasterId,
      member_name: firstName ?? null,
    })

  if (error) {
    // Unique constraint violation = already signed up
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already signed up' }, { status: 409 })
    }
    console.error('[Signup] insert failed:', error)
    // Return error code to help diagnose env/permission issues without log access
    return NextResponse.json(
      { error: 'Failed to sign up', code: error.code, detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
