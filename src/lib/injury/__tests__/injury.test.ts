import { describe, it, expect, vi, beforeEach } from 'vitest'
import { REGIONS, REGION_IDS, regionLabel, regionsFor } from '../regions'
import { cleanNewInjury, cleanUpdate, injuryNoteBody, therapistTaskTitle, type InjuryRow } from '../rules'
import { createInjury, updateInjury, type InjuryNotifier, type InjuryStore } from '../service'
import { staffHubInjuryNotifier } from '../notify'

const TODAY = '2026-11-05'
const valid = { areas: ['knee_left'], injuredOn: '2026-10-20', pain: 6, status: 'current', seenTherapist: false, notes: 'Twinge on squats', wantsTherapistInfo: true }

const row = (over: Partial<InjuryRow> = {}): InjuryRow => ({
  id: '11111111-1111-4111-8111-111111111111',
  gymmaster_member_id: '100',
  areas: ['knee_left', 'ankle_right'],
  injured_on: '2026-10-20',
  pain: 6,
  status: 'current',
  seen_therapist: true,
  therapist_note: 'Physio, rest 2 weeks',
  notes: 'Twinge on squats',
  wants_therapist_info: true,
  consent_at: '2026-11-05T10:00:00Z',
  alert_sent_at: null,
  resolved_at: null,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
  ...over,
})

describe('regions', () => {
  it('has front and back figures with unique ids per view', () => {
    for (const view of ['front', 'back'] as const) {
      const ids = regionsFor(view).map(r => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    expect(REGION_IDS.has('lower_back')).toBe(true)
    expect(regionsFor('front').some(r => r.id === 'lower_back')).toBe(false)
    expect(regionsFor('back').some(r => r.id === 'lower_back')).toBe(true)
  })
  it("member's left is drawn unflipped (viewer's right) from the front and flipped from the back", () => {
    const flip = (view: 'front' | 'back', id: string) => REGIONS.find(r => r.view === view && r.id === id)!.flip
    expect(flip('front', 'knee_left')).toBe(false)
    expect(flip('front', 'knee_right')).toBe(true)
    expect(flip('back', 'knee_left')).toBe(true)
    expect(flip('back', 'knee_right')).toBe(false)
    expect(flip('front', 'chest')).toBe(false)
  })
  it('labels read naturally', () => {
    expect(regionLabel('knee_left')).toBe('Left knee')
    expect(regionLabel('quad_right')).toBe('Right front of thigh')
  })
})

describe('cleanNewInjury', () => {
  it('accepts a good report', () => {
    const r = cleanNewInjury(valid, TODAY)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toMatchObject({ areas: ['knee_left'], pain: 6, wantsTherapistInfo: true, therapistNote: null })
  })
  it.each([
    ['no area', { ...valid, areas: [] }],
    ['unknown area', { ...valid, areas: ['elbow_middle'] }],
    ['future date', { ...valid, injuredOn: '2026-11-06' }],
    ['impossible date', { ...valid, injuredOn: '2026-02-31' }],
    ['pain 11', { ...valid, pain: 11 }],
    ['pain as text', { ...valid, pain: '5' }],
    ['resolved at creation', { ...valid, status: 'resolved' }],
    ['therapist answer missing', { ...valid, seenTherapist: undefined }],
    ['notes too long', { ...valid, notes: 'x'.repeat(1001) }],
  ])('rejects %s', (_n, input) => {
    expect(cleanNewInjury(input, TODAY).ok).toBe(false)
  })
  it('drops therapist details when no therapist was seen, and removes duplicate areas', () => {
    const r = cleanNewInjury({ ...valid, areas: ['knee_left', 'knee_left'], therapistNote: 'Dr X' }, TODAY)
    expect(r.ok && r.value.areas).toEqual(['knee_left'])
    expect(r.ok && r.value.therapistNote).toBeNull()
  })
})

describe('cleanUpdate', () => {
  it('accepts status or pain, rejects empty and unknown', () => {
    expect(cleanUpdate({ status: 'resolved' }).ok).toBe(true)
    expect(cleanUpdate({ pain: 2 }).ok).toBe(true)
    expect(cleanUpdate({}).ok).toBe(false)
    expect(cleanUpdate({ status: 'gone' }).ok).toBe(false)
  })
})

describe('staff words', () => {
  it('note carries the facts staff need', () => {
    const t = injuryNoteBody(row(), 'reported')
    expect(t).toContain('Left knee, Right ankle')
    expect(t).toContain('Pain 6/10')
    expect(t).toContain('Physio, rest 2 weeks')
    expect(t).toContain('Would like to hear about therapist services')
    expect(t.length).toBeLessThan(2000)
  })
  it('task title names the member', () => {
    expect(therapistTaskTitle('Test Member', row())).toContain('Test Member would like therapist info')
    expect(therapistTaskTitle(null, row())).toContain('A member')
  })
})

function fakes() {
  const store: InjuryStore = {
    list: vi.fn(async () => []),
    insert: vi.fn(async () => row()),
    update: vi.fn(async () => ({ before: row(), after: row({ status: 'resolved' }) })),
    markAlerted: vi.fn(async () => undefined),
  }
  const notifier: InjuryNotifier = { reported: vi.fn(async () => true), resolved: vi.fn(async () => undefined) }
  return { store, notifier }
}
const now = new Date('2026-11-05T10:00:00Z')

describe('createInjury', () => {
  let f: ReturnType<typeof fakes>
  beforeEach(() => (f = fakes()))
  it('needs consent and writes nothing without it', async () => {
    const r = await createInjury(f.store, f.notifier, '100', { input: valid, consent: false, now })
    expect(r.status).toBe(400)
    expect(f.store.insert).not.toHaveBeenCalled()
  })
  it('saves, tells staff and records the alert', async () => {
    const r = await createInjury(f.store, f.notifier, '100', { input: valid, consent: true, now })
    expect(r.status).toBe(200)
    expect(f.store.insert).toHaveBeenCalledWith('100', expect.objectContaining({ pain: 6 }), now.toISOString())
    expect(f.notifier.reported).toHaveBeenCalled()
    expect(f.store.markAlerted).toHaveBeenCalled()
  })
  it('still succeeds, logging a code only, when the staff alert fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(f.notifier.reported).mockRejectedValueOnce(new Error('staffhub_note_failed'))
    const r = await createInjury(f.store, f.notifier, '100', { input: { ...valid, notes: 'PRIVATE WORDS' }, consent: true, now })
    expect(r.status).toBe(200)
    expect(JSON.stringify(spy.mock.calls)).not.toContain('PRIVATE WORDS')
    spy.mockRestore()
  })
})

describe('updateInjury', () => {
  it('rejects a bad id and an empty update', async () => {
    const f = fakes()
    expect((await updateInjury(f.store, f.notifier, '100', { id: '1;drop', input: { status: 'resolved' }, now })).status).toBe(400)
    expect((await updateInjury(f.store, f.notifier, '100', { id: row().id, input: {}, now })).status).toBe(400)
    expect(f.store.update).not.toHaveBeenCalled()
  })
  it("404 for another member's report (the store finds none)", async () => {
    const f = fakes()
    vi.mocked(f.store.update).mockResolvedValueOnce(null)
    expect((await updateInjury(f.store, f.notifier, '999', { id: row().id, input: { status: 'resolved' }, now })).status).toBe(404)
    expect(f.notifier.resolved).not.toHaveBeenCalled()
  })
  it('stamps resolved_at and tells staff once when resolved', async () => {
    const f = fakes()
    const r = await updateInjury(f.store, f.notifier, '100', { id: row().id, input: { status: 'resolved' }, now })
    expect(r.status).toBe(200)
    expect(f.store.update).toHaveBeenCalledWith('100', row().id, { status: 'resolved', resolvedAt: now.toISOString() })
    expect(f.notifier.resolved).toHaveBeenCalledTimes(1)
  })
})

describe('staffHubInjuryNotifier', () => {
  function client() {
    const inserts: Array<{ table: string; row: Record<string, unknown> }> = []
    const c = {
      from: (table: string) => ({
        insert: async (r: Record<string, unknown>) => {
          inserts.push({ table, row: r })
          return { error: null }
        },
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { full_name: 'Test Member' } }) }) }),
      }),
    }
    return { c: c as never, inserts }
  }
  it('adds a sensitive injury note, and a dashboard task only when therapist info was asked for', async () => {
    const { c, inserts } = client()
    const n = staffHubInjuryNotifier(c)
    expect(await n.reported(row())).toBe(true)
    expect(inserts.map(i => i.table)).toEqual(['member_notes', 'coach_tasks'])
    expect(inserts[0].row).toMatchObject({ note_type: 'injury_health', sensitive: true, author_coach_id: null })
    expect(inserts[1].row).toMatchObject({ coach_id: null, source: 'injury_report', source_key: `injury-${row().id}` })
    expect(String(inserts[1].row.title)).toContain('Test Member')
    inserts.length = 0
    expect(await n.reported(row({ wants_therapist_info: false }))).toBe(false)
    expect(inserts.map(i => i.table)).toEqual(['member_notes'])
  })
})
