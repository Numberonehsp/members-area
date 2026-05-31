import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'
import { getMemberProfile } from '@/lib/gymmaster'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''
  const gymMasterToken = cookieStore.get('gymmaster_token')?.value

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { eventId, friendName, friendEmail, friendPhone } = body as {
    eventId: string
    friendName: string
    friendEmail?: string
    friendPhone?: string
  }

  if (!eventId || !friendName?.trim()) {
    return NextResponse.json(
      { error: 'eventId and friendName are required' },
      { status: 400 },
    )
  }

  if (!friendEmail?.trim() && !friendPhone?.trim()) {
    return NextResponse.json(
      { error: 'At least one of email or phone is required' },
      { status: 400 },
    )
  }

  // Resolve member name — cookies first, GymMaster API as fallback
  let memberName = [firstName, lastName].filter(Boolean).join(' ')
  if (!memberName && gymMasterToken) {
    const profile = await getMemberProfile(gymMasterToken)
    if (profile?.firstName) {
      memberName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    }
  }
  if (!memberName) memberName = `Member ${gymMasterId}`

  const { error } = await staffHubWriter.from('bring_a_friend_signups').insert({
    event_id: eventId,
    gymmaster_member_id: gymMasterId,
    member_name: memberName,
    friend_name: friendName.trim(),
    friend_email: friendEmail?.trim() || null,
    friend_phone: friendPhone?.trim() || null,
  })

  if (error) {
    console.error('[bring-a-friend] insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to register guest' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
