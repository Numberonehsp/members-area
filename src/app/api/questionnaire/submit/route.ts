import { NextResponse } from 'next/server'
import { submit } from '@/lib/questionnaire/service'
import { isVariant } from '@/lib/questionnaire/schema'
import { failed, questionnaireContext } from '../guard'

// POST { variant?, answers?, consent: true } — submit. Needs every required answer and consent.
export async function POST(req: Request) {
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  let body: { variant?: unknown; answers?: unknown; consent?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const variant = body.variant ?? 'adult'
  if (!isVariant(variant)) return NextResponse.json({ error: 'Unknown questionnaire.' }, { status: 400 })
  try {
    const r = await submit(ctx.store, ctx.memberId, variant, { answers: body.answers, consent: body.consent, now: new Date() })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('submit', err)
  }
}
