import { NextRequest, NextResponse } from 'next/server'
import { staffHubReader, staffHubWriter } from '@/lib/staffhub'

export async function GET() {
  const { data, error } = await staffHubReader
    .from('challenges')
    .select('id, name, description, start_date, end_date, signup_deadline, how_to_signup, is_active')
    .order('start_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[coach/challenges] fetch failed:', error.message)
    return NextResponse.json({ challenges: [] })
  }

  return NextResponse.json({ challenges: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, type, target, unit, start_date, end_date, is_active } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { error } = await staffHubWriter
    .from('challenges')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      challenge_type: type || 'custom',
      target_description: unit?.trim() ? `${target ?? ''} ${unit}`.trim() : null,
      start_date: start_date || today,
      end_date: end_date || today,
      is_active: is_active ?? true,
    })

  if (error) {
    console.error('[coach/challenges] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, is_active } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await staffHubWriter
    .from('challenges')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    console.error('[coach/challenges] update failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
