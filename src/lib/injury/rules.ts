// Pure rules for injury reports: checking what a member sends, and the words
// staff see. No database, so every rule is tested on its own.

import { REGION_IDS, regionLabel } from './regions'

export const STATUSES = ['current', 'recovering', 'resolved'] as const
export type InjuryStatus = (typeof STATUSES)[number]

/** Pain at or above this is shown to coaches as high. */
export const HIGH_PAIN = 7
export const MAX_AREAS = 8
export const NOTES_MAX = 1000
export const THERAPIST_NOTE_MAX = 200

export type NewInjury = {
  areas: string[]
  injuredOn: string
  pain: number
  status: Exclude<InjuryStatus, 'resolved'>
  seenTherapist: boolean
  therapistNote: string | null
  notes: string | null
  wantsTherapistInfo: boolean
}

export type InjuryRow = {
  id: string
  gymmaster_member_id: string
  areas: string[]
  injured_on: string
  pain: number
  status: InjuryStatus
  seen_therapist: boolean
  therapist_note: string | null
  notes: string | null
  wants_therapist_info: boolean
  consent_at: string
  alert_sent_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string }
const bad = (error: string): { ok: false; error: string } => ({ ok: false, error })

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

function validDate(s: unknown, today: string): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false
  return s <= today && s >= '1950-01-01'
}

function text(raw: unknown, max: number, label: string): Result<string | null> {
  if (raw === undefined || raw === null) return { ok: true, value: null }
  if (typeof raw !== 'string') return bad(`${label} must be text.`)
  const t = raw.trim()
  if (t.length > max) return bad(`${label} can be up to ${max} characters.`)
  return { ok: true, value: t === '' ? null : t }
}

export function cleanNewInjury(raw: unknown, today: string): Result<NewInjury> {
  if (typeof raw !== 'object' || raw === null) return bad('Missing injury details.')
  const r = raw as Record<string, unknown>

  if (!Array.isArray(r.areas) || r.areas.length === 0) return bad('Tap the area that is injured.')
  if (r.areas.length > MAX_AREAS) return bad(`Pick up to ${MAX_AREAS} areas.`)
  const areas = [...new Set(r.areas)]
  if (!areas.every((a): a is string => typeof a === 'string' && REGION_IDS.has(a))) return bad('Unknown body area.')

  if (!validDate(r.injuredOn, today)) return bad('Add the date it happened. It cannot be in the future.')

  if (typeof r.pain !== 'number' || !Number.isInteger(r.pain) || r.pain < 0 || r.pain > 10) return bad('Pick a pain level from 0 to 10.')

  if (r.status !== 'current' && r.status !== 'recovering') return bad('Say whether it is current or recovering.')

  if (typeof r.seenTherapist !== 'boolean') return bad('Say whether you have seen a physio or sports therapist.')
  const therapistNote = text(r.therapistNote, THERAPIST_NOTE_MAX, 'Therapist details')
  if (!therapistNote.ok) return therapistNote
  const notes = text(r.notes, NOTES_MAX, 'Notes')
  if (!notes.ok) return notes

  return {
    ok: true,
    value: {
      areas,
      injuredOn: r.injuredOn,
      pain: r.pain,
      status: r.status,
      seenTherapist: r.seenTherapist,
      therapistNote: r.seenTherapist ? therapistNote.value : null,
      notes: notes.value,
      wantsTherapistInfo: r.wantsTherapistInfo === true,
    },
  }
}

export type InjuryUpdate = { status?: InjuryStatus; pain?: number }

export function cleanUpdate(raw: unknown): Result<InjuryUpdate> {
  if (typeof raw !== 'object' || raw === null) return bad('Missing update.')
  const r = raw as Record<string, unknown>
  const out: InjuryUpdate = {}
  if (r.status !== undefined) {
    if (typeof r.status !== 'string' || !(STATUSES as readonly string[]).includes(r.status)) return bad('Unknown status.')
    out.status = r.status as InjuryStatus
  }
  if (r.pain !== undefined) {
    if (typeof r.pain !== 'number' || !Number.isInteger(r.pain) || r.pain < 0 || r.pain > 10) return bad('Pick a pain level from 0 to 10.')
    out.pain = r.pain
  }
  if (out.status === undefined && out.pain === undefined) return bad('Nothing to update.')
  return { ok: true, value: out }
}

export const areasWords = (areas: string[]): string => areas.map(regionLabel).join(', ')

const dateWords = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** The member note staff see in the Member Admin record. Plain text, under 2000 characters. */
export function injuryNoteBody(row: Pick<InjuryRow, 'areas' | 'injured_on' | 'pain' | 'status' | 'seen_therapist' | 'therapist_note' | 'notes' | 'wants_therapist_info'>, event: 'reported' | 'resolved'): string {
  const head = event === 'resolved' ? 'Injury marked as resolved by the member' : 'Injury reported by the member in the members area'
  const parts = [
    `${head}: ${areasWords(row.areas)}.`,
    `Happened ${dateWords(row.injured_on)}. Pain ${row.pain}/10. Status: ${row.status}.`,
    row.seen_therapist ? `Has seen a physio or therapist${row.therapist_note ? ` (${row.therapist_note})` : ''}.` : 'Has not seen a physio or therapist.',
  ]
  if (row.notes) parts.push(`Member notes: ${row.notes}`)
  if (event === 'reported' && row.wants_therapist_info) parts.push('Would like to hear about therapist services.')
  return parts.join(' ')
}

/** Dashboard task for the team when a member asks about therapist services. */
export function therapistTaskTitle(name: string | null, row: Pick<InjuryRow, 'areas' | 'pain'>): string {
  return `Injury: ${name ?? 'A member'} would like therapist info (${areasWords(row.areas)}, pain ${row.pain}/10). Forward to a therapist.`
}
