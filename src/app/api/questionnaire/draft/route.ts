import { NextResponse } from 'next/server'
import { saveDraft } from '@/lib/questionnaire/service'
import { failed, questionnaireContext } from '../guard'

// PUT { answers } — save progress. Only the answers sent change.
export async function PUT(req: Request) {
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  let body: { answers?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const r = await saveDraft(ctx.store, ctx.memberId, body.answers ?? {})
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('draft', err)
  }
}
