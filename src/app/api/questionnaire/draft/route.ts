import { NextResponse } from 'next/server'
import { saveDraft } from '@/lib/questionnaire/service'
import { isVariant } from '@/lib/questionnaire/schema'
import { failed, questionnaireContext } from '../guard'

// PUT { variant?, answers } — save progress. Only the answers sent change.
export async function PUT(req: Request) {
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  let body: { variant?: unknown; answers?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const variant = body.variant ?? 'adult'
  if (!isVariant(variant)) return NextResponse.json({ error: 'Unknown questionnaire.' }, { status: 400 })
  try {
    const r = await saveDraft(ctx.store, ctx.memberId, variant, body.answers ?? {})
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('draft', err)
  }
}
