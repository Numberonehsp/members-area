import { NextRequest, NextResponse } from 'next/server'
import { staffHubWriter } from '@/lib/staffhub'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, expires_in_days } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const expiresAt = expires_in_days
    ? new Date(Date.now() + expires_in_days * 86400000).toISOString().split('T')[0]
    : null

  const { error } = await staffHubWriter
    .from('events')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      event_type: 'announcement',
      start_date: today,
      end_date: null,
      expires_at: expiresAt,
    })

  if (error) {
    console.error('[coach/announcements] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
