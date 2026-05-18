import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const VALID_PLANS = ['foundations', 'gym-only', 'sweat', 'perform', 'nutrition', null, '']

/**
 * POST /api/coach/content/publish
 * Upserts a publish/access override for a pathway, module, or resource.
 * Body: { id, entity_type, is_published, required_plan? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { id, entity_type, is_published, required_plan } = body

  if (!id || !entity_type || typeof is_published !== 'boolean') {
    return NextResponse.json({ error: 'id, entity_type, and is_published are required' }, { status: 400 })
  }

  const VALID_TYPES = ['pathway', 'module', 'resource']
  if (!VALID_TYPES.includes(entity_type)) {
    return NextResponse.json({ error: `entity_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  const supabase = db()

  const row: Record<string, unknown> = {
    id,
    entity_type,
    is_published,
    updated_at: new Date().toISOString(),
  }

  // Only include required_plan if it was explicitly sent
  if ('required_plan' in body) {
    row.required_plan = required_plan === '' ? null : (required_plan ?? null)
  }

  const { error } = await supabase.from('education_publish_overrides').upsert(row)

  if (error) {
    console.error('[coach/content/publish] upsert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
