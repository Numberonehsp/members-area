import { describe, it, expect } from 'vitest'
import { cleanAnswers, missingRequired, type Answers } from '../answers'
import { flagsFor, scoresFor } from '../scoring'
import { ALL_QUESTIONS, SECTIONS } from '../schema'
import { getState, saveDraft, submit, type QuestionnaireRow, type QuestionnaireStore } from '../service'

// Synthetic data only.
const complete = (): Answers => {
  const a: Answers = {}
  for (const q of ALL_QUESTIONS) {
    if (!q.required) continue
    a[q.id] =
      q.kind === 'scale' ? 6 : q.kind === 'yesno' ? false : q.kind === 'multi' ? [q.options[0].value] : q.kind === 'single' ? q.options[0].value : q.kind === 'hours' ? 0 : 'text'
  }
  a.sleep_hours = '7'
  return a
}

describe('schema', () => {
  it('has unique question ids and every choice question has options', () => {
    const ids = ALL_QUESTIONS.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of ALL_QUESTIONS) if (q.kind === 'single' || q.kind === 'multi') expect(q.options.length).toBeGreaterThan(1)
    expect(SECTIONS.length).toBeGreaterThan(5)
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

function fakeStore() {
  const rows: QuestionnaireRow[] = []
  let n = 0
  const store: QuestionnaireStore = {
    async findDraft(m) { return rows.find(r => r.gymmaster_member_id === m && r.status === 'draft') ?? null },
    async latestSubmitted(m) { return rows.filter(r => r.gymmaster_member_id === m && r.status === 'submitted').at(-1) ?? null },
    async saveDraft(m, kind, answers) {
      const ex = rows.find(r => r.gymmaster_member_id === m && r.status === 'draft')
      if (ex) { ex.answers = answers; return ex }
      const row: QuestionnaireRow = { id: `q${++n}`, gymmaster_member_id: m, kind, version: 1, status: 'draft', answers, scores: {}, flags: [], consent_at: null, submitted_at: null, updated_at: 't' }
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
    await saveDraft(store, '100', { priority_1: 'A', rating_stress: 5 })
    const r = await saveDraft(store, '100', { priority_2: 'B', priority_1: '' })
    expect(r.status).toBe(200)
    expect((r.body as { draft: QuestionnaireRow }).draft.answers).toEqual({ rating_stress: 5, priority_2: 'B' })
  })

  it('a bad draft is a 400 and saves nothing', async () => {
    const { store, rows } = fakeStore()
    expect((await saveDraft(store, '100', { rating_stress: 99 })).status).toBe(400)
    expect(rows).toHaveLength(0)
  })

  it('submit needs consent and every required answer', async () => {
    const { store } = fakeStore()
    const now = new Date('2026-11-05T12:00:00Z')
    expect((await submit(store, '100', { answers: complete(), consent: false, now })).status).toBe(400)
    expect((await submit(store, '100', { answers: { priority_1: 'x' }, consent: true, now })).status).toBe(400)
  })

  it('submit stores scores, flags and consent time; the next one is a refresh', async () => {
    const { store, rows } = fakeStore()
    const now = new Date('2026-11-05T12:00:00Z')
    const a = { ...complete(), has_pain: true }
    const r = await submit(store, '100', { answers: a, consent: true, now })
    expect(r.status).toBe(200)
    expect(rows[0]).toMatchObject({ status: 'submitted', kind: 'initial', consent_at: now.toISOString(), flags: ['pain_or_injury'] })
    await saveDraft(store, '100', { priority_1: 'new' })
    expect(rows[1].kind).toBe('refresh')
  })

  it('answers saved earlier count towards a submit', async () => {
    const { store } = fakeStore()
    await saveDraft(store, '100', complete())
    expect((await submit(store, '100', { answers: {}, consent: true, now: new Date() })).status).toBe(200)
  })

  it('one member never sees another’s answers', async () => {
    const { store } = fakeStore()
    await saveDraft(store, '100', { priority_1: 'mine' })
    const other = await getState(store, '200')
    expect(other).toEqual({ draft: null, latest: null })
  })
})
