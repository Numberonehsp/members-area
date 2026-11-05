// Service-role Supabase client for the Members Area database.
//
// It bypasses row-level security, so it is for server code only (API routes and
// Server Components), never a 'use client' file. Use it for tables that hold
// health or other private data and have row-level security ON with no policy
// (the anon key can read nothing there). Every route that uses it must first
// work out who is asking: verifiedMemberId() for members, a Supabase
// role=coach session for coaches. Never take a member id from the request.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function adminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // Fail closed: no key means no access, never a fall back to the anon key.
    throw new Error('supabase_admin_not_configured')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
