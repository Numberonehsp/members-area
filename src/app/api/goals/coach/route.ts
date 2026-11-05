import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// GET — the goals a coach wrote in this member's Staff Hub check-ins
// (current goals and next goal), copied here by the Staff Hub.
// A member only ever reads their own, from the login cookie.
export async function GET() {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data, error } = await db
    .from('member_coach_goals')
    .select('kind, goal_text, set_on, set_by')
    .eq('gymmaster_member_id', gymmaster_member_id)

  if (error) {
    console.error('[goals/coach] fetch error:', error.code)
    return NextResponse.json({ error: 'Could not load goals from your coach' }, { status: 500 })
  }
  return NextResponse.json({ goals: data ?? [] })
}
