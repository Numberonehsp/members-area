import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Validate if a string is a valid UUID v4 format
function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Ensure ID is a valid UUID, generate new one if not
function ensureValidUUID(id: unknown): string {
  if (isValidUUID(id)) {
    return id as string
  }
  // Generate a new UUID for invalid IDs
  return randomUUID()
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('gym_partners')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[partners] fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map website_url → website for component compatibility
    const mapped = (data ?? []).map(p => ({
      ...p,
      website: p.website_url ?? '',
    }))

    return NextResponse.json({ data: mapped })
  } catch (err) {
    console.error('[partners] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'Valid partner ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('gym_partners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[partners] delete error:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[partners] delete error:', err)
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to delete partner: ${errorMsg}` }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { partners } = body

    if (!Array.isArray(partners)) {
      return NextResponse.json({ error: 'Partners must be an array' }, { status: 400 })
    }

    console.log('[partners] saving', partners.length, 'partners')

    // Upsert all partners in one call instead of individual requests
    const { error, data } = await supabase
      .from('gym_partners')
      .upsert(
        partners.map(partner => ({
          id: ensureValidUUID(partner.id),
          name: partner.name,
          category: partner.category || '',
          emoji: partner.emoji || '',
          description: partner.description || '',
          offer: partner.offer || '',
          website_url: partner.website || '',
          is_active: partner.is_active !== undefined ? partner.is_active : true,
          display_order: partner.display_order || 0,
        })),
        { onConflict: 'id' }
      )

    if (error) {
      console.error('[partners] upsert error:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log('[partners] saved successfully, data:', data)
    return NextResponse.json({ ok: true, count: partners.length })
  } catch (err) {
    console.error('[partners] save error:', err)
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to save partners: ${errorMsg}` }, { status: 500 })
  }
}
