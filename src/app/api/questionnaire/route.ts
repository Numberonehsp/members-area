import { NextResponse } from 'next/server'
import { getState } from '@/lib/questionnaire/service'
import { isVariant } from '@/lib/questionnaire/schema'
import { failed, questionnaireContext } from './guard'

// GET ?variant=adult|youth — the signed-in member's own draft and latest submitted questionnaire.
export async function GET(req: Request) {
  const v = new URL(req.url).searchParams.get('variant') ?? 'adult'
  if (!isVariant(v)) return NextResponse.json({ error: 'Unknown questionnaire.' }, { status: 400 })
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  try {
    return NextResponse.json(await getState(ctx.store, ctx.memberId, v))
  } catch (err) {
    return failed('GET', err)
  }
}
