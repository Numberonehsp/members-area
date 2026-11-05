// Coach portal: the latest submitted questionnaire per variant for one member.
// Private data: service-role read, server only. The caller must already be a
// signed-in coach (the /coach routes are gated in src/proxy.ts).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuestionnaireRow } from './service'
import type { Variant } from './schema'

export type CoachQuestionnaires = Partial<Record<Variant, QuestionnaireRow>>

/** null means the data could not be loaded (as opposed to {} for none submitted). */
export async function latestQuestionnaires(db: () => SupabaseClient, memberId: string): Promise<CoachQuestionnaires | null> {
  try {
    const { data, error } = await db()
      .from('member_questionnaires')
      .select('id, gymmaster_member_id, kind, variant, version, status, answers, scores, flags, consent_at, submitted_at, updated_at')
      .eq('gymmaster_member_id', memberId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(10)
    if (error) return null
    const out: CoachQuestionnaires = {}
    for (const row of (data ?? []) as QuestionnaireRow[]) if (!out[row.variant]) out[row.variant] = row
    return out
  } catch {
    return null
  }
}
