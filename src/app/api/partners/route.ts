import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[partners] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
          id: partner.id,
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
