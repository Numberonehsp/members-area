import { describe, it, expect } from 'vitest'
import { answerSections, formatAnswer, radarPoint, radarPolygon, sleepPercent } from '../view'
import { questionById } from '../schema'
import { latestQuestionnaires } from '../coachView'

describe('formatAnswer', () => {
  it('uses option labels, yes/no with detail, scales and hours', () => {
    expect(formatAnswer(questionById('contact_pref', 'adult')!, 'whatsapp')).toBe('WhatsApp')
    expect(formatAnswer(questionById('goals', 'adult')!, ['x'])).toBe('x')
    const pain = questionById('has_pain', 'adult')!
    expect(formatAnswer(pain, true, { pain_detail: 'Left knee' })).toBe('Yes: Left knee')
    expect(formatAnswer(pain, false, { pain_detail: 'ignored' })).toBe('No')
    expect(formatAnswer(questionById('rating_stress', 'adult')!, 7)).toBe('7/10')
    expect(formatAnswer(questionById('hours_work', 'adult')!, 37.5)).toBe('37.5 hours')
  })
  it('returns null for nothing answered', () => {
    expect(formatAnswer(questionById('why_now', 'adult')!, undefined)).toBeNull()
    expect(formatAnswer(questionById('why_now', 'adult')!, '')).toBeNull()
  })
})

describe('answerSections', () => {
  it('lists only answered questions, in form order, folding details into their row', () => {
    const s = answerSections('adult', { has_pain: true, pain_detail: 'Shoulder', rating_health: 6 })
    const rows = s.flatMap(x => x.rows)
    expect(rows.map(r => r.id)).toEqual(['has_pain', 'rating_health'])
    expect(rows[0].text).toBe('Yes: Shoulder')
  })
  it('uses the youth form for youth answers', () => {
    const rows = answerSections('youth', { guardian_name: 'Test Parent', has_asthma_allergy: false }).flatMap(x => x.rows)
    expect(rows.map(r => r.id)).toEqual(['guardian_name', 'has_asthma_allergy'])
  })
})

describe('radar and sleep', () => {
  it('first axis points straight up, 10 reaches the radius', () => {
    expect(radarPoint(0, 5, 10, 80, 100, 100)).toEqual([100, 20])
    expect(radarPoint(0, 5, 0, 80, 100, 100)).toEqual([100, 100])
  })
  it('missing ratings close the polygon at the centre', () => {
    const pts = radarPolygon({ health: 10 }, 80, 100, 100).split(' ')
    expect(pts).toHaveLength(5)
    expect(pts[0]).toBe('100,100')
  })
  it('sleep bar runs from 4 to 10 hours', () => {
    expect([sleepPercent(4), sleepPercent(7), sleepPercent(10), sleepPercent(2)]).toEqual([0, 50, 100, 0])
  })
})

describe('latestQuestionnaires', () => {
  const chain = (result: { data: unknown; error: unknown }) => {
    const q: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order']) q[m] = () => q
    q.limit = async () => result
    return { from: () => q } as never
  }
  it('keeps the newest row per variant', async () => {
    const rows = [
      { id: 'a', variant: 'adult', submitted_at: '2026-11-05' },
      { id: 'b', variant: 'adult', submitted_at: '2026-10-01' },
      { id: 'c', variant: 'youth', submitted_at: '2026-09-01' },
    ]
    const r = await latestQuestionnaires(() => chain({ data: rows, error: null }), '100')
    expect(r?.adult?.id).toBe('a')
    expect(r?.youth?.id).toBe('c')
  })
  it('null on a database error or a missing key, {} when nothing is submitted', async () => {
    expect(await latestQuestionnaires(() => chain({ data: null, error: { message: 'x' } }), '100')).toBeNull()
    expect(await latestQuestionnaires(() => { throw new Error('supabase_admin_not_configured') }, '100')).toBeNull()
    expect(await latestQuestionnaires(() => chain({ data: [], error: null }), '100')).toEqual({})
  })
})
