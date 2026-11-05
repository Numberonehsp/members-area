import { NextResponse } from 'next/server'
import { submit } from '@/lib/questionnaire/service'
import { failed, questionnaireContext } from '../guard'

// POST { answers?, consent: true } — submit. Needs every required answer and consent.
export async function POST(req: Request) {
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  let body: { answers?: unknown; consent?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const r = await submit(ctx.store, ctx.memberId, { answers: body.answers, consent: body.consent, now: new Date() })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('submit', err)
  }
}
