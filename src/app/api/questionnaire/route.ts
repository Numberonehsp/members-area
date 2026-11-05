import { NextResponse } from 'next/server'
import { getState } from '@/lib/questionnaire/service'
import { failed, questionnaireContext } from './guard'

// GET — the signed-in member's own draft and latest submitted questionnaire.
export async function GET() {
  const ctx = await questionnaireContext()
  if ('response' in ctx) return ctx.response
  try {
    return NextResponse.json(await getState(ctx.store, ctx.memberId))
  } catch (err) {
    return failed('GET', err)
  }
}
