import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function membersAreaClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  const firstName = cookieStore.get('gymmaster_first_name')?.value ?? ''
  const lastName = cookieStore.get('gymmaster_last_name')?.value ?? ''

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { week_start?: string; energy?: number; sleep?: number; stress?: number; comments?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { week_start, energy, sleep, stress, comments } = body

  if (!week_start || !energy || !sleep || !stress) {
    return NextResponse.json({ error: 'week_start, energy, sleep, and stress are required' }, { status: 400 })
  }

  const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Member'

  const supabase = membersAreaClient()

  const { data, error } = await supabase
    .from('wellbeing_checkins')
    .upsert(
      {
        gymmaster_member_id: memberId,
        week_start,
        energy,
        sleep,
        stress,
        comments: comments?.trim() || null,
      },
      { onConflict: 'gymmaster_member_id,week_start' }
    )
    .select('id, gymmaster_member_id, week_start, energy, sleep, stress, comments, created_at')
    .single()

  if (error) {
    console.error('[wellbeing POST] upsert error:', error.message)
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  console.log(`[wellbeing] check-in saved for ${memberName} (${memberId}), week ${week_start}`)
  return NextResponse.json({ checkin: data }, { status: 201 })
}
