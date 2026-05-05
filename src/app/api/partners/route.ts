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

    // Upsert each partner (insert if new, update if exists)
    const upsertPromises = partners.map(partner =>
      supabase
        .from('gym_partners')
        .upsert(
          {
            id: partner.id,
            name: partner.name,
            category: partner.category,
            emoji: partner.emoji,
            description: partner.description,
            offer: partner.offer,
            website_url: partner.website,
            is_active: partner.is_active,
            display_order: partner.display_order,
          },
          { onConflict: 'id' }
        )
    )

    const results = await Promise.all(upsertPromises)

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('[partners] upsert error:', result.error)
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, count: partners.length })
  } catch (err) {
    console.error('[partners] save error:', err)
    return NextResponse.json({ error: 'Failed to save partners' }, { status: 500 })
  }
}
