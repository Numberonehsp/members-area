import { NextRequest, NextResponse } from 'next/server'

// Demo login — for staff to preview the Members Area as a member would see it.
// Sets a fake cookie session with no GymMaster ID so no real data is shown.
// This route is intentionally open — the demo user sees an empty/generic experience.

const DEMO_PASSPHRASE = process.env.DEMO_LOGIN_PASSPHRASE ?? 'numberone-demo'

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json()

  if (!passphrase || passphrase !== DEMO_PASSPHRASE) {
    return NextResponse.json({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  }

  // Use a special demo ID that won't match any real participant
  response.cookies.set('gymmaster_member_id', 'DEMO', cookieOpts)
  response.cookies.set('gymmaster_first_name', 'Demo', cookieOpts)
  response.cookies.set('gymmaster_last_name', 'Member', { ...cookieOpts, httpOnly: false })
  response.cookies.set('gymmaster_token', 'demo-token', { ...cookieOpts, httpOnly: true })

  return response
}
