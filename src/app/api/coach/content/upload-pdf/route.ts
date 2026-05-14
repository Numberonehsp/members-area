import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })
  }

  const ext = '.pdf'
  const slug = file.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  const timestamp = Date.now()
  const path = `education/${timestamp}-${slug}${ext}`

  const supabase = db()
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('resources')
    .upload(path, bytes, { contentType: 'application/pdf', upsert: false })

  if (error) {
    console.error('[upload-pdf] storage error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('resources')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
