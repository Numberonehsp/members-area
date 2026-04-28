import { NextRequest, NextResponse } from 'next/server'
import { loginMember, getMemberProfile, getAnnualVisits } from '@/lib/gymmaster'
import { createClient } from '@supabase/supabase-js'

async function updateVisitCache(
  memberId: string,
  memberName: string,
  token: string
) {
  try {
    const annual = await getAnnualVisits(memberId, token)
    const now = new Date()
    const thisMonth = now.getMonth() + 1

    const visitsThisMonth = annual.find(m => m.month === thisMonth)?.visitCount ?? 0

    // We don't have individual visit dates from this endpoint — but we can
    // infer the last visit month. Store the most recent month with visits.
    const lastActiveMonth = [...annual].reverse().find(m => m.visitCount > 0)
    let lastVisitDate: string | null = null
    if (lastActiveMonth) {
      // Use the last day of that month as a conservative estimate
      const d = new Date(now.getFullYear(), lastActiveMonth.month, 0) // day 0 = last day of prev month
      lastVisitDate = d.toISOString().split('T')[0]
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    await supabase.from('member_visit_cache').upsert({
      gymmaster_member_id: memberId,
      member_name: memberName,
      visits_this_month: visitsThisMonth,
      last_visit_date: lastVisitDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'gymmaster_member_id' })
  } catch (err) {
    // Cache update is best-effort — never block login
    console.error('[login] visit cache update failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const result = await loginMember(email, password)

  if (!result) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Try to fetch the member's profile so we can greet them by name on the dashboard.
  // If this fails we still log the user in — name just falls back to "there".
  const profile = await getMemberProfile(result.token)

  const response = NextResponse.json({ memberId: result.memberid }, { status: 200 })

  // httpOnly token cookie — never exposed to the browser
  response.cookies.set('gymmaster_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  // Member id (readable so server components / client can use it without a profile call)
  response.cookies.set('gymmaster_member_id', result.memberid, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  // First name for the welcome banner — only set if we successfully fetched the profile
  if (profile?.firstName) {
    response.cookies.set('gymmaster_first_name', profile.firstName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
  }
  if (profile?.lastName) {
    response.cookies.set('gymmaster_last_name', profile.lastName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
  }

  // Fire-and-forget: cache this member's visit data for the coach portal
  const memberName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Member'
  updateVisitCache(result.memberid, memberName, result.token)

  return response
}
