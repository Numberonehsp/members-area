import { NextResponse } from 'next/server'
import { createInjury, listInjuries } from '@/lib/injury/service'
import { failed, injuryContext } from './guard'

// GET — the signed-in member's own injury reports.
export async function GET() {
  const ctx = await injuryContext()
  if ('response' in ctx) return ctx.response
  try {
    const r = await listInjuries(ctx.store, ctx.memberId)
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('list', err)
  }
}

// POST { ...injury, consent: true } — report a new injury.
export async function POST(req: Request) {
  const ctx = await injuryContext()
  if ('response' in ctx) return ctx.response
  let body: { consent?: unknown } & Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const { consent, ...input } = body ?? {}
    const r = await createInjury(ctx.store, ctx.notifier, ctx.memberId, { input, consent, now: new Date() })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('create', err)
  }
}
