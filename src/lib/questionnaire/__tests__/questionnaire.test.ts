import { describe, it, expect } from 'vitest'
import { cleanAnswers, missingRequired, type Answers } from '../answers'
import { flagsFor, scoresFor } from '../scoring'
import { questionsFor, sectionsFor, consentTextFor, type Variant } from '../schema'
import { getState, saveDraft, submit, type QuestionnaireRow, type QuestionnaireStore } from '../service'

// Synthetic data only.
const complete = (variant: Variant = 'adult'): Answers => {
  const a: Answers = {}
  for (const q of questionsFor(variant)) {
    if (!q.required) continue
    a[q.id] =
      q.kind === 'scale' ? 6 : q.kind === 'yesno' ? false : q.kind === 'multi' ? [q.options[0].value] : q.kind === 'single' ? q.options[0].value : q.kind === 'hours' ? 0 : 'text'
  }
  if (variant === 'adult') a.sleep_hours = '7'
  else a.sleep_hours_youth = '9'
  return a
}

describe('schema', () => {
  it.each(['adult', 'youth'] as const)('%s: unique question ids and every choice question has options', v => {
    const ids = questionsFor(v).map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of questionsFor(v)) if (q.kind === 'single' || q.kind === 'multi') expect(q.options.length).toBeGreaterThan(1)
    expect(sectionsFor(v).length).toBeGreaterThan(4)
  })

  it('the youth version is shorter and uses parent consent wording', () => {
    expect(questionsFor('youth').length).toBeLessThan(questionsFor('adult').length)
    expect(consentTextFor('youth')).toMatch(/parent or legal guardian/)
    expect(consentTextFor('adult')).not.toMatch(/guardian/)
  })

  it('the youth version has no weight-loss goal and no alcohol or medication-reduction questions', () => {
    const youth = JSON.stringify(sectionsFor('youth')).toLowerCase()
    expect(youth).not.toMatch(/lose weight|lose_fat|alcohol|reliance on medication/)
  })
})

describe('cleanAnswers', () => {
  it('accepts valid answers and trims text', () => {
    const r = cleanAnswers({ priority_1: '  Get fitter ', rating_stress: 7, has_pain: true, goals: ['lose_fat', 'lose_fat', 'health'] })
    expect(r).toEqual({ ok: true, answers: { priority_1: 'Get fitter', rating_stress: 7, has_pain: true, goals: ['lose_fat', 'health'] } })
  })
  it('rejects unknown questions and bad values', () => {
    expect(cleanAnswers({ nope: 1 }).ok).toBe(false)
    expect(cleanAnswers({ rating_stress: 11 }).ok).toBe(false)
    expect(cleanAnswers({ rating_stress: 5.5 }).ok).toBe(false)
    expect(cleanAnswers({ sleep_hours: '3' }).ok).toBe(false)
    expect(cleanAnswers({ goals: ['nope'] }).ok).toBe(false)
    expect(cleanAnswers({ hours_work: 200 }).ok).toBe(false)
    expect(cleanAnswers({ priority_1: 'x'.repeat(1001) }).ok).toBe(false)
    expect(cleanAnswers({ emergency_name: 'x'.repeat(121) }).ok).toBe(false)
    expect(cleanAnswers([]).ok).toBe(false)
    expect(cleanAnswers(null).ok).toBe(false)
  })
  it('drops blank text, and the detail fields of a yes/no are valid questions', () => {
    expect(cleanAnswers({ worked: '   ' })).toEqual({ ok: true, answers: {} })
    expect(cleanAnswers({ pain_detail: 'Left knee' }).ok).toBe(true)
  })
})

describe('missingRequired', () => {
  it('lists required questions with no answer, and an empty list means ready', () => {
    expect(missingRequired(complete())).toEqual([])
    expect(missingRequired({}).length).toBeGreaterThan(5)
    const a = complete()
    a.goals = []
    expect(missingRequired(a).map(q => q.id)).toEqual(['goals'])
  })
})

describe('scoring and flags', () => {
  it('totals weekly hours and reads sleep', () => {
    const s = scoresFor({ hours_work: 40, hours_travel: 5, hours_caring: 10.5, sleep_hours: '6', rating_stress: 9 })
    expect(s.timeUse).toEqual({ work: 40, study: 0, travel: 5, caring: 10.5, other: 0, total: 55.5 })
    expect(s.sleepHours).toBe(6)
    expect(s.ratings.stress).toBe(9)
  })
  it('raises flags for the concerns, and none for a settled member', () => {
    expect(flagsFor(complete())).toEqual([])
    const f = flagsFor({ has_condition: true, has_pain: true, takes_meds: true, rating_health: 4, rating_stress: 8, sleep_hours: '5', rating_support: 3, ready: 8, willing: 5, able: 3 })
    expect(f).toEqual(['medical_condition', 'pain_or_injury', 'medication', 'low_health', 'high_stress', 'low_sleep', 'low_support', 'readiness_gap'])
  })
  it('does not flag borderline values', () => {
    expect(flagsFor({ rating_health: 5, rating_stress: 7, sleep_hours: '6', rating_support: 4, ready: 6, willing: 6, able: 4 })).toEqual([])
  })
})

describe('youth variant', () => {
  it('accepts youth answers, and rejects adult-only questions on the youth form (and the reverse)', () => {
    expect(cleanAnswers({ youth_goals: ['stronger'], sleep_hours_youth: '9', guardian_name: 'Test Parent' }, 'youth').ok).toBe(true)
    expect(cleanAnswers({ alcohol: 'none' }, 'youth').ok).toBe(false)
    expect(cleanAnswers({ youth_goals: ['stronger'] }, 'adult').ok).toBe(false)
    expect(cleanAnswers({ sleep_hours_youth: '9' }, 'adult').ok).toBe(false)
  })

  it('requires the guardian details and the health questions', () => {
    const ids = missingRequired({}, 'youth').map(q => q.id)
    expect(ids).toEqual(expect.arrayContaining(['guardian_name', 'guardian_phone', 'has_condition', 'has_asthma_allergy']))
    expect(missingRequired(complete('youth'), 'youth')).toEqual([])
  })

  it('flags youth sleep at 7 hours or fewer, not 5, and asthma or allergy', () => {
    expect(flagsFor({ sleep_hours_youth: '7-' }, 'youth')).toEqual(['low_sleep'])
    expect(flagsFor({ sleep_hours_youth: '8' }, 'youth')).toEqual([])
    expect(flagsFor({ sleep_hours: '6' }, 'adult')).toEqual([])
    expect(flagsFor({ has_asthma_allergy: true }, 'youth')).toEqual(['asthma_or_allergy'])
  })
})

function fakeStore() {
  const rows: QuestionnaireRow[] = []
  let n = 0
  const store: QuestionnaireStore = {
    async findDraft(m, v) { return rows.find(r => r.gymmaster_member_id === m && r.variant === v && r.status === 'draft') ?? null },
    async latestSubmitted(m, v) { return rows.filter(r => r.gymmaster_member_id === m && r.variant === v && r.status === 'submitted').at(-1) ?? null },
    async saveDraft(m, v, kind, answers) {
      const ex = rows.find(r => r.gymmaster_member_id === m && r.variant === v && r.status === 'draft')
      if (ex) { ex.answers = answers; return ex }
      const row: QuestionnaireRow = { id: `q${++n}`, gymmaster_member_id: m, kind, variant: v, version: 1, status: 'draft', answers, scores: {}, flags: [], consent_at: null, submitted_at: null, updated_at: 't' }
      rows.push(row)
      return row
    },
    async markSubmitted(id, p) {
      const r = rows.find(x => x.id === id)!
      Object.assign(r, { status: 'submitted', answers: p.answers, scores: p.scores, flags: p.flags, consent_at: p.consentAt, submitted_at: p.submittedAt })
      return r
    },
  }
  return { store, rows }
}

describe('service', () => {
  it('a draft merges what was sent with what was saved, and a blank clears an answer', async () => {
    const { store } = fakeStore()
    await saveDraft(store, '100', 'adult', { priority_1: 'A', rating_stress: 5 })
    const r = await saveDraft(store, '100', 'adult', { priority_2: 'B', priority_1: '' })
    expect(r.status).toBe(200)
    expect((r.body as { draft: QuestionnaireRow }).draft.answers).toEqual({ rating_stress: 5, priority_2: 'B' })
  })

  it('a bad draft is a 400 and saves nothing', async () => {
    const { store, rows } = fakeStore()
    expect((await saveDraft(store, '100', 'adult', { rating_stress: 99 })).status).toBe(400)
    expect(rows).toHaveLength(0)
  })

  it('submit needs consent and every required answer', async () => {
    const { store } = fakeStore()
    const now = new Date('2026-11-05T12:00:00Z')
    expect((await submit(store, '100', 'adult', { answers: complete(), consent: false, now })).status).toBe(400)
    expect((await submit(store, '100', 'adult', { answers: { priority_1: 'x' }, consent: true, now })).status).toBe(400)
  })

  it('submit stores scores, flags and consent time; the next one is a refresh', async () => {
    const { store, rows } = fakeStore()
    const now = new Date('2026-11-05T12:00:00Z')
    const a = { ...complete(), has_pain: true }
    const r = await submit(store, '100', 'adult', { answers: a, consent: true, now })
    expect(r.status).toBe(200)
    expect(rows[0]).toMatchObject({ status: 'submitted', kind: 'initial', consent_at: now.toISOString(), flags: ['pain_or_injury'] })
    await saveDraft(store, '100', 'adult', { priority_1: 'new' })
    expect(rows[1].kind).toBe('refresh')
  })

  it('answers saved earlier count towards a submit', async () => {
    const { store } = fakeStore()
    await saveDraft(store, '100', 'adult', complete())
    expect((await submit(store, '100', 'adult', { answers: {}, consent: true, now: new Date() })).status).toBe(200)
  })

  it('adult and youth answers are kept apart for the same member', async () => {
    const { store, rows } = fakeStore()
    await saveDraft(store, '100', 'adult', { priority_1: 'adult goal' })
    await saveDraft(store, '100', 'youth', { priority_1: 'youth goal' })
    expect(rows).toHaveLength(2)
    expect((await getState(store, '100', 'youth')).draft?.answers).toEqual({ priority_1: 'youth goal' })
    const r = await submit(store, '100', 'youth', { answers: complete('youth'), consent: true, now: new Date('2026-11-05T12:00:00Z') })
    expect(r.status).toBe(200)
    expect(rows.find(x => x.variant === 'youth')).toMatchObject({ status: 'submitted', kind: 'initial' })
    expect(rows.find(x => x.variant === 'adult')?.status).toBe('draft')
  })

  it('one member never sees another’s answers', async () => {
    const { store } = fakeStore()
    await saveDraft(store, '100', 'adult', { priority_1: 'mine' })
    const other = await getState(store, '200', 'adult')
    expect(other).toEqual({ draft: null, latest: null })
  })
})
