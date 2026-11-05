// Saving and reading a member's injury reports. The member id always comes from
// verifiedMemberId() in the route, never from the request. The store and the
// notifier are small interfaces so these rules are tested without a database.

import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanNewInjury, cleanUpdate, isUuid, type InjuryRow, type InjuryStatus, type NewInjury } from './rules'

export interface InjuryStore {
  list(memberId: string): Promise<InjuryRow[]>
  insert(memberId: string, v: NewInjury, consentAt: string): Promise<InjuryRow>
  /** Only a row that belongs to the member; null when there is none. */
  update(memberId: string, id: string, patch: { status?: InjuryStatus; pain?: number; resolvedAt?: string | null }): Promise<{ before: InjuryRow; after: InjuryRow } | null>
  markAlerted(id: string, at: string): Promise<void>
}

/** Tells staff. Best effort: a failure here never fails the member's save. */
export interface InjuryNotifier {
  /** Returns true when a dashboard task for the team was created. */
  reported(row: InjuryRow): Promise<boolean>
  resolved(row: InjuryRow): Promise<void>
}

type Result<T> = { status: number; body: T | { error: string } }
const fail = (status: number, error: string): Result<never> => ({ status, body: { error } })

export async function listInjuries(store: InjuryStore, memberId: string): Promise<Result<{ injuries: InjuryRow[] }>> {
  return { status: 200, body: { injuries: await store.list(memberId) } }
}

export async function createInjury(
  store: InjuryStore,
  notifier: InjuryNotifier,
  memberId: string,
  args: { input: unknown; consent: unknown; now: Date },
): Promise<Result<{ injury: InjuryRow }>> {
  if (args.consent !== true) return fail(400, 'Please tick the box to say you are happy for us to store this.')
  const at = args.now.toISOString()
  const cleaned = cleanNewInjury(args.input, at.slice(0, 10))
  if (!cleaned.ok) return fail(400, cleaned.error)
  let injury = await store.insert(memberId, cleaned.value, at)
  try {
    const alerted = await notifier.reported(injury)
    if (alerted) {
      await store.markAlerted(injury.id, at)
      injury = { ...injury, alert_sent_at: at }
    }
  } catch (err) {
    // Code only: never log what the member wrote.
    console.error('[injury] notify failed:', err instanceof Error ? err.message : 'unknown')
  }
  return { status: 200, body: { injury } }
}

export async function updateInjury(
  store: InjuryStore,
  notifier: InjuryNotifier,
  memberId: string,
  args: { id: unknown; input: unknown; now: Date },
): Promise<Result<{ injury: InjuryRow }>> {
  if (!isUuid(args.id)) return fail(400, 'Unknown injury.')
  const cleaned = cleanUpdate(args.input)
  if (!cleaned.ok) return fail(400, cleaned.error)
  const patch = {
    ...cleaned.value,
    ...(cleaned.value.status !== undefined ? { resolvedAt: cleaned.value.status === 'resolved' ? args.now.toISOString() : null } : {}),
  }
  const r = await store.update(memberId, args.id, patch)
  if (!r) return fail(404, 'Injury not found.')
  if (r.before.status !== 'resolved' && r.after.status === 'resolved') {
    try {
      await notifier.resolved(r.after)
    } catch (err) {
      console.error('[injury] notify failed:', err instanceof Error ? err.message : 'unknown')
    }
  }
  return { status: 200, body: { injury: r.after } }
}

const COLUMNS =
  'id, gymmaster_member_id, areas, injured_on, pain, status, seen_therapist, therapist_note, notes, wants_therapist_info, consent_at, alert_sent_at, resolved_at, created_at, updated_at'

export function supabaseInjuryStore(db: SupabaseClient): InjuryStore {
  return {
    async list(memberId) {
      const { data, error } = await db
        .from('member_injuries')
        .select(COLUMNS)
        .eq('gymmaster_member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw new Error('injury_list_failed')
      return (data ?? []) as InjuryRow[]
    },
    async insert(memberId, v, consentAt) {
      const { data, error } = await db
        .from('member_injuries')
        .insert({
          gymmaster_member_id: memberId,
          areas: v.areas,
          injured_on: v.injuredOn,
          pain: v.pain,
          status: v.status,
          seen_therapist: v.seenTherapist,
          therapist_note: v.therapistNote,
          notes: v.notes,
          wants_therapist_info: v.wantsTherapistInfo,
          consent_at: consentAt,
        })
        .select(COLUMNS)
        .single()
      if (error || !data) throw new Error('injury_insert_failed')
      return data as InjuryRow
    },
    async update(memberId, id, patch) {
      const { data: before, error: readErr } = await db
        .from('member_injuries')
        .select(COLUMNS)
        .eq('id', id)
        .eq('gymmaster_member_id', memberId)
        .maybeSingle()
      if (readErr) throw new Error('injury_read_failed')
      if (!before) return null
      const change: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.status !== undefined) change.status = patch.status
      if (patch.pain !== undefined) change.pain = patch.pain
      if (patch.resolvedAt !== undefined) change.resolved_at = patch.resolvedAt
      const { data: after, error } = await db
        .from('member_injuries')
        .update(change)
        .eq('id', id)
        .eq('gymmaster_member_id', memberId)
        .select(COLUMNS)
        .single()
      if (error || !after) throw new Error('injury_update_failed')
      return { before: before as InjuryRow, after: after as InjuryRow }
    },
    async markAlerted(id, at) {
      const { error } = await db.from('member_injuries').update({ alert_sent_at: at }).eq('id', id)
      if (error) throw new Error('injury_alert_mark_failed')
    },
  }
}
