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

  // ── Coach route protection ───────────────────────────────────────────────
  // /coach/* (except /coach/login) requires a Supabase session with role=coach
  if (pathname.startsWith('/coach') && pathname !== '/coach/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/coach/login', request.url))
    }
    const role = user.user_metadata?.role
    if (role !== 'coach') {
      return NextResponse.redirect(new URL('/coach/login', request.url))
    }
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
