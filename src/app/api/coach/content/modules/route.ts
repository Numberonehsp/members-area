import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/** POST — create a module inside a DB pathway */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { pathway_id, title, description, video_url, pdf_url, duration_minutes, is_published, module_order } = body as {
    pathway_id: string
    title: string
    description?: string | null
    video_url?: string | null
    pdf_url?: string | null
    duration_minutes?: number | null
    is_published?: boolean
    module_order?: number
  }

  if (!pathway_id) return NextResponse.json({ error: 'pathway_id is required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { data, error } = await db()
    .from('education_modules')
    .insert({
      pathway_id,
      title: title.trim(),
      description: description?.trim() || null,
      video_url: video_url?.trim() || null,
      pdf_url: pdf_url?.trim() || null,
      duration_minutes: duration_minutes || null,
      is_published: is_published ?? false,
      module_order: module_order ?? 1,
    })
    .select('id, pathway_id, title, description, video_url, pdf_url, duration_minutes, is_published, module_order, created_at')
    .single()

  if (error || !data) {
    console.error('[modules POST] insert failed:', error?.message)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }

  return NextResponse.json({ module: data }, { status: 201 })
}

/** PUT — update a module in a DB pathway */
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, title, description, video_url, pdf_url, duration_minutes, is_published } = body as {
    id: string
    title: string
    description?: string | null
    video_url?: string | null
    pdf_url?: string | null
    duration_minutes?: number | null
    is_published?: boolean
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await db()
    .from('education_modules')
    .update({
      title: title?.trim(),
      description: description?.trim() || null,
      video_url: video_url?.trim() || null,
      pdf_url: pdf_url?.trim() || null,
      duration_minutes: duration_minutes || null,
      is_published: is_published ?? false,
    })
    .eq('id', id)

  if (error) {
    console.error('[modules PUT] update failed:', error.message)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE — remove a module */
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await db().from('education_modules').delete().eq('id', id)

  if (error) {
    console.error('[modules DELETE] failed:', error.message)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
