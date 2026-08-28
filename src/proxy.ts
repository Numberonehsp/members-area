import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── Supabase session refresh ─────────────────────────────────────────────
  // Always refresh the Supabase session on every request so cookies stay valid
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isCoach = user?.user_metadata?.role === 'coach'

  // ── Coach route protection ───────────────────────────────────────────────
  // /coach/* (except /coach/login) requires a Supabase session with role=coach
  if (pathname.startsWith('/coach') && pathname !== '/coach/login') {
    if (!isCoach) {
      return NextResponse.redirect(new URL('/coach/login', request.url))
    }
  }

  // ── Coach API protection ────────────────────────────────────────────────
  // These endpoints read/write any member's records via the service-role
  // client, so they must be coach-only. (Member InBody self-entry is a
  // separate route, /api/inbody/member, guarded by the GymMaster cookie.)
  const isCoachApi =
    pathname.startsWith('/api/coach/') || pathname === '/api/inbody'
  if (isCoachApi && !isCoach) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Member route protection ──────────────────────────────────────────────
  // Member pages are protected by a GymMaster session cookie (gymmaster_token)
  // set by /api/auth/login. Supabase is not used for member auth.
  const memberRoutes = [
    '/dashboard',
    '/education',
    '/results',
    '/community',
    '/partners',
    '/profile',
    '/messages',
    '/wellbeing',
    '/commitment-club',
    '/goals',
    '/notifications',
  ]
  const isMemberRoute = memberRoutes.some(route => pathname.startsWith(route))

  if (isMemberRoute) {
    const gymMasterToken = request.cookies.get('gymmaster_token')
    if (!gymMasterToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
