import { NextRequest, NextResponse } from 'next/server'
import { loginMember, getMemberProfile } from '@/lib/gymmaster'

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

  return response
}
