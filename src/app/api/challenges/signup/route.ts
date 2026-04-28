import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { staffHubWriter } from '@/lib/staffhub'
import { getMemberProfile } from '@/lib/gymmaster'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const gymMasterId = cookieStore.get('gymmaster_member_id')?.value
  const gymMasterToken = cookieStore.get('gymmaster_token')?.value

  if (!gymMasterId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { challengeId } = body

  if (!challengeId) {
    return NextResponse.json({ error: 'challengeId required' }, { status: 400 })
  }

  // 1. Record the self-signup (upsert — safe to retry)
  const { error: signupError } = await staffHubWriter
    .from('challenge_signups')
    .upsert(
      { challenge_id: challengeId, gymmaster_member_id: gymMasterId },
      { onConflict: 'challenge_id,gymmaster_member_id' }
    )

  if (signupError) {
    console.error('[Signup] challenge_signups upsert failed:', signupError.message, '| code:', signupError.code)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }

  // 2. Add to challenge_participants so staff see them in the Staff Hub.
  //    Check first to avoid hitting the partial unique index with a plain upsert.
  const { data: alreadyParticipant, error: checkError } = await staffHubWriter
    .from('challenge_participants')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('gymmaster_member_id', gymMasterId)
    .maybeSingle()

  if (checkError) {
    console.error('[Signup] challenge_participants check failed:', checkError.message)
  }

  if (!alreadyParticipant) {
    let memberName = `Member ${gymMasterId}`
    if (gymMasterToken) {
      const profile = await getMemberProfile(gymMasterToken)
      if (profile?.firstName) {
        memberName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
      }
    }

    const { error: participantError } = await staffHubWriter
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        member_name: memberName,
        gymmaster_member_id: gymMasterId,
      })

    if (participantError && participantError.code !== '23505') {
      console.error('[Signup] challenge_participants insert failed:', participantError.message, '| code:', participantError.code)
    }
  }

  return NextResponse.json({ success: true })
}
