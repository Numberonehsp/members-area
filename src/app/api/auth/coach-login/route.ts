import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Verify the user has the coach role
  const role = data.user.user_metadata?.role
  if (role !== 'coach') {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Access denied. Coach accounts only.' }, { status: 403 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
