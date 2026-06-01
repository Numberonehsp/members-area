import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const VALID_CATEGORIES = ['nutrition', 'training', 'recovery', 'mindset']
const VALID_TYPES = ['video', 'pdf', 'article', 'link']

/** POST — create a new resource. Returns { resource } with the real UUID. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, description, category, resource_type, url, required_plan, is_published } = body as {
    title: string
    description?: string | null
    category: string
    resource_type: string
    url: string
    required_plan?: string | null
    is_published?: boolean
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
  }
  if (!VALID_TYPES.includes(resource_type)) {
    return NextResponse.json({ error: `resource_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  const supabase = db()
  const { data, error } = await supabase
    .from('education_resources')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category,
      resource_type,
      url: url?.trim() ?? '',
      thumbnail_url: null,
      required_plan: required_plan || null,
      is_published: is_published ?? false,
    })
    .select('id, title, description, category, resource_type, url, thumbnail_url, required_plan, is_published, created_at')
    .single()

  if (error || !data) {
    console.error('[coach/content/resources POST] insert failed:', error?.message)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }

  return NextResponse.json({ resource: data }, { status: 201 })
}

/** PUT — update an existing DB resource (not seed resources). */
export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, title, description, category, resource_type, url, required_plan, is_published } = body as {
    id: string
    title: string
    description?: string | null
    category: string
    resource_type: string
    url: string
    required_plan?: string | null
    is_published?: boolean
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase
    .from('education_resources')
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      category,
      resource_type,
      url: url?.trim() ?? '',
      required_plan: required_plan || null,
      is_published: is_published ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[coach/content/resources PUT] update failed:', error.message)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
