import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = db()

  const { data, error } = await supabase
    .from('member_tasks')
    .select('id, title, description, due_date, set_by, completed_at, created_at')
    .eq('gymmaster_member_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ tasks: [] })
  }

  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title, description, due_date, set_by, member_name } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const supabase = db()

  const { data, error } = await supabase
    .from('member_tasks')
    .insert({
      gymmaster_member_id: id,
      member_name: member_name ?? null,
      title: title.trim(),
      description: description?.trim() || null,
      due_date: due_date || null,
      set_by: set_by?.trim() || 'Coach',
    })
    .select('id, title, description, due_date, set_by, completed_at, created_at')
    .single()

  if (error || !data) {
    console.error('[coach/members/tasks POST] error:', error?.message)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }

  return NextResponse.json({ task: data }, { status: 201 })
}
