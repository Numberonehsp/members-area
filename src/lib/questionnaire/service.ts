// Saving and submitting a member's questionnaire. The member id always comes
// from verifiedMemberId() in the route, never from the request. The store is a
// small interface so these rules can be tested without a database.

import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanAnswers, missingRequired, type Answers } from './answers'
import { flagsFor, scoresFor, type FlagCode, type Scores } from './scoring'
import { QUESTIONNAIRE_VERSION, type Variant } from './schema'

export type QuestionnaireRow = {
  id: string
  gymmaster_member_id: string
  kind: 'initial' | 'refresh'
  variant: Variant
  version: number
  status: 'draft' | 'submitted'
  answers: Answers
  scores: Scores | Record<string, never>
  flags: FlagCode[]
  consent_at: string | null
  submitted_at: string | null
  updated_at: string
}

export interface QuestionnaireStore {
  findDraft(memberId: string, variant: Variant): Promise<QuestionnaireRow | null>
  latestSubmitted(memberId: string, variant: Variant): Promise<QuestionnaireRow | null>
  saveDraft(memberId: string, variant: Variant, kind: 'initial' | 'refresh', answers: Answers): Promise<QuestionnaireRow>
  markSubmitted(
    id: string,
    patch: { answers: Answers; scores: Scores; flags: FlagCode[]; consentAt: string; submittedAt: string },
  ): Promise<QuestionnaireRow>
}

type Result<T> = { status: number; body: T | { error: string } }
const fail = (status: number, error: string): Result<never> => ({ status, body: { error } })

export async function getState(store: QuestionnaireStore, memberId: string, variant: Variant) {
  const [draft, latest] = await Promise.all([store.findDraft(memberId, variant), store.latestSubmitted(memberId, variant)])
  return { draft, latest }
}

const kindFor = (latest: QuestionnaireRow | null) => (latest ? ('refresh' as const) : ('initial' as const))

export async function saveDraft(store: QuestionnaireStore, memberId: string, variant: Variant, raw: unknown): Promise<Result<{ draft: QuestionnaireRow }>> {
  const cleaned = cleanAnswers(raw, variant)
  if (!cleaned.ok) return fail(400, cleaned.error)
  const [existing, latest] = await Promise.all([store.findDraft(memberId, variant), store.latestSubmitted(memberId, variant)])
  // A draft keeps earlier saved answers: the form sends only what changed.
  const merged: Answers = { ...(existing?.answers ?? {}), ...cleaned.answers }
  // Blank text answers sent as '' were dropped by cleanAnswers; an explicit clear removes the old value.
  if (typeof raw === 'object' && raw !== null) {
    for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === null || (typeof v === 'string' && v.trim() === '')) delete merged[id]
    }
  }
  const draft = await store.saveDraft(memberId, variant, existing?.kind ?? kindFor(latest), merged)
  return { status: 200, body: { draft } }
}

export async function submit(
  store: QuestionnaireStore,
  memberId: string,
  variant: Variant,
  args: { answers: unknown; consent: unknown; now: Date },
): Promise<Result<{ submitted: QuestionnaireRow }>> {
  if (args.consent !== true) return fail(400, 'Please tick the box to say you are happy for us to store your answers.')
  const cleaned = cleanAnswers(args.answers ?? {}, variant)
  if (!cleaned.ok) return fail(400, cleaned.error)
  const [existing, latest] = await Promise.all([store.findDraft(memberId, variant), store.latestSubmitted(memberId, variant)])
  const answers: Answers = { ...(existing?.answers ?? {}), ...cleaned.answers }
  const missing = missingRequired(answers, variant)
  if (missing.length > 0) return fail(400, `Please answer: ${missing[0].label}`)
  const draft = existing ?? (await store.saveDraft(memberId, variant, kindFor(latest), answers))
  const at = args.now.toISOString()
  const submitted = await store.markSubmitted(draft.id, {
    answers,
    scores: scoresFor(answers),
    flags: flagsFor(answers, variant),
    consentAt: at,
    submittedAt: at,
  })
  return { status: 200, body: { submitted } }
}

const COLS = 'id, gymmaster_member_id, kind, variant, version, status, answers, scores, flags, consent_at, submitted_at, updated_at'

/** Supabase store. Needs the service-role client: the table has no public access. */
export function supabaseQuestionnaireStore(db: SupabaseClient): QuestionnaireStore {
  const one = (res: { data: unknown; error: { code?: string } | null }, code: string) => {
    if (res.error) throw new Error(`${code}:${res.error.code ?? 'unknown'}`)
    return res.data as QuestionnaireRow
  }
  return {
    async findDraft(memberId, variant) {
      const res = await db.from('member_questionnaires').select(COLS).eq('gymmaster_member_id', memberId).eq('variant', variant).eq('status', 'draft').order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (res.error) throw new Error(`questionnaire_read:${res.error.code ?? 'unknown'}`)
      return (res.data as QuestionnaireRow | null) ?? null
    },
    async latestSubmitted(memberId, variant) {
      const res = await db.from('member_questionnaires').select(COLS).eq('gymmaster_member_id', memberId).eq('variant', variant).eq('status', 'submitted').order('submitted_at', { ascending: false }).limit(1).maybeSingle()
      if (res.error) throw new Error(`questionnaire_read:${res.error.code ?? 'unknown'}`)
      return (res.data as QuestionnaireRow | null) ?? null
    },
    async saveDraft(memberId, variant, kind, answers) {
      const existing = await this.findDraft(memberId, variant)
      const now = new Date().toISOString()
      if (existing) {
        return one(await db.from('member_questionnaires').update({ answers, updated_at: now }).eq('id', existing.id).select(COLS).single(), 'questionnaire_save')
      }
      return one(
        await db.from('member_questionnaires').insert({ gymmaster_member_id: memberId, kind, variant, version: QUESTIONNAIRE_VERSION, status: 'draft', answers }).select(COLS).single(),
        'questionnaire_save',
      )
    },
    async markSubmitted(id, p) {
      return one(
        await db
          .from('member_questionnaires')
          .update({ status: 'submitted', answers: p.answers, scores: p.scores, flags: p.flags, consent_at: p.consentAt, submitted_at: p.submittedAt, updated_at: p.submittedAt })
          .eq('id', id)
          .select(COLS)
          .single(),
        'questionnaire_submit',
      )
    },
  }
}
