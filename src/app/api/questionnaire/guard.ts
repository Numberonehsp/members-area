import { NextResponse } from 'next/server'
import { verifiedMemberId } from '@/lib/member-auth'
import { adminSupabase } from '@/lib/supabase-admin'
import { isQuestionnaireEnabled } from '@/lib/questionnaire/enabled'
import { supabaseQuestionnaireStore, type QuestionnaireStore } from '@/lib/questionnaire/service'

/** Switch, sign-in and database, in that order. A response means stop. */
export async function questionnaireContext(): Promise<{ response: NextResponse } | { memberId: string; store: QuestionnaireStore }> {
  if (!isQuestionnaireEnabled()) return { response: NextResponse.json({ error: 'Not available yet.' }, { status: 404 }) }
  const memberId = await verifiedMemberId()
  if (!memberId) return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  try {
    return { memberId, store: supabaseQuestionnaireStore(adminSupabase()) }
  } catch {
    console.error('[questionnaire] not configured')
    return { response: NextResponse.json({ error: 'Not set up yet.' }, { status: 503 }) }
  }
}

/** Log a code only, never answers. */
export function failed(where: string, err: unknown): NextResponse {
  console.error(`[questionnaire] ${where} failed:`, err instanceof Error ? err.message : 'unknown')
  return NextResponse.json({ error: 'Something went wrong. Your answers have not been lost; try again.' }, { status: 500 })
}
