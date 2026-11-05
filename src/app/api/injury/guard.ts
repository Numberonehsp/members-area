import { NextResponse } from 'next/server'
import { verifiedMemberId } from '@/lib/member-auth'
import { adminSupabase } from '@/lib/supabase-admin'
import { isQuestionnaireEnabled } from '@/lib/questionnaire/enabled'
import { staffHubWriter } from '@/lib/staffhub'
import { supabaseInjuryStore, type InjuryNotifier, type InjuryStore } from '@/lib/injury/service'
import { staffHubInjuryNotifier } from '@/lib/injury/notify'

/** Switch (shared with the questionnaire), sign-in and database, in that order. A response means stop. */
export async function injuryContext(): Promise<{ response: NextResponse } | { memberId: string; store: InjuryStore; notifier: InjuryNotifier }> {
  if (!isQuestionnaireEnabled()) return { response: NextResponse.json({ error: 'Not available yet.' }, { status: 404 }) }
  const memberId = await verifiedMemberId()
  if (!memberId) return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  try {
    return { memberId, store: supabaseInjuryStore(adminSupabase()), notifier: staffHubInjuryNotifier(staffHubWriter) }
  } catch {
    console.error('[injury] not configured')
    return { response: NextResponse.json({ error: 'Not set up yet.' }, { status: 503 }) }
  }
}

/** Log a code only, never what the member wrote. */
export function failed(where: string, err: unknown): NextResponse {
  console.error(`[injury] ${where} failed:`, err instanceof Error ? err.message : 'unknown')
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
