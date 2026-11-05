import { NextResponse } from 'next/server'
import { updateInjury } from '@/lib/injury/service'
import { failed, injuryContext } from '../guard'

// PATCH { status?, pain? } — update one of the member's own reports.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await injuryContext()
  if ('response' in ctx) return ctx.response
  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const r = await updateInjury(ctx.store, ctx.notifier, ctx.memberId, { id, input: body, now: new Date() })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    return failed('update', err)
  }
}
