import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const VALID_CATEGORIES = ['nutrition', 'training', 'recovery', 'mindset']

/** POST — create a new pathway */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, description, category, required_plan, is_published, display_order } = body as {
    title: string
    description?: string | null
    category: string
    required_plan?: string | null
    is_published?: boolean
    display_order?: number
  }

  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
  }

  const { data, error } = await db()
    .from('education_pathways')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category,
      required_plan: required_plan || null,
      is_published: is_published ?? false,
      display_order: display_order ?? 999,
      is_sequential: false,
    })
    .select('id, title, description, category, required_plan, is_published, display_order, is_sequential, thumbnail_url, created_at')
    .single()

  if (error || !data) {
    console.error('[pathways POST] insert failed:', error?.message)
    return NextResponse.json({ error: 'Failed to create pathway' }, { status: 500 })
  }

  return NextResponse.json({ pathway: data }, { status: 201 })
}

/** PUT — update an existing DB pathway */
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, title, description, category, required_plan, is_published } = body as {
    id: string
    title: string
    description?: string | null
    category: string
    required_plan?: string | null
    is_published?: boolean
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { error } = await db()
    .from('education_pathways')
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      category,
      required_plan: required_plan || null,
      is_published: is_published ?? false,
    })
    .eq('id', id)

  if (error) {
    console.error('[pathways PUT] update failed:', error.message)
    return NextResponse.json({ error: 'Failed to update pathway' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE — remove a DB pathway and its modules */
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = db()
  await supabase.from('education_modules').delete().eq('pathway_id', id)
  const { error } = await supabase.from('education_pathways').delete().eq('id', id)

  if (error) {
    console.error('[pathways DELETE] failed:', error.message)
    return NextResponse.json({ error: 'Failed to delete pathway' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
