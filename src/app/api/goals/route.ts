import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET — fetch goals for a member
// Members: reads their own ID from cookie
// Coach: pass ?memberId=xxx to read any member's goals
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const memberIdParam = searchParams.get('memberId')

  let gymmaster_member_id: string | undefined

  if (memberIdParam) {
    // Coach fetching a specific member's goals
    gymmaster_member_id = memberIdParam
  } else {
    // Member fetching their own goals
    const cookieStore = await cookies()
    gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value
  }

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await db()
    .from('member_goals')
    .select('*')
    .eq('gymmaster_member_id', gymmaster_member_id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[goals] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goals: data ?? [] })
}

// POST — create a new goal
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { type, title, target_value, current_value, start_value, unit, deadline, note } = body

  if (!type || !title || target_value == null || deadline == null) {
    return NextResponse.json({ error: 'type, title, target_value, and deadline are required' }, { status: 400 })
  }

  const { data, error } = await db()
    .from('member_goals')
    .insert({
      gymmaster_member_id,
      type,
      title,
      target_value,
      current_value: current_value ?? 0,
      start_value: start_value ?? current_value ?? 0,
      unit: unit ?? '',
      deadline,
      status: 'active',
      note: note ?? '',
    })
    .select('*')
    .single()

  if (error) {
    console.error('[goals] insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goal: data }, { status: 201 })
}

// PUT — update an existing goal (edit fields or mark complete)
export async function PUT(req: NextRequest) {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) {
    return NextResponse.json({ error: 'Goal ID required' }, { status: 400 })
  }

  const allowedFields = ['type', 'title', 'target_value', 'current_value', 'unit', 'deadline', 'note', 'status']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in fields) update[key] = fields[key]
  }

  const { data, error } = await db()
    .from('member_goals')
    .update(update)
    .eq('id', id)
    .eq('gymmaster_member_id', gymmaster_member_id)
    .select('*')
    .single()

  if (error) {
    console.error('[goals] update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goal: data })
}

// DELETE — remove a goal
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const gymmaster_member_id = cookieStore.get('gymmaster_member_id')?.value

  if (!gymmaster_member_id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'Goal ID required' }, { status: 400 })
  }

  const { error } = await db()
    .from('member_goals')
    .delete()
    .eq('id', id)
    .eq('gymmaster_member_id', gymmaster_member_id)

  if (error) {
    console.error('[goals] delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
