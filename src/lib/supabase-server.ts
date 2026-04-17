import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server client — use in Server Components, API Routes, and middleware
// Reads/writes cookies for session management
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies can't be set here.
            // Middleware handles session refresh instead.
          }
        },
      },
    }
  )
}
