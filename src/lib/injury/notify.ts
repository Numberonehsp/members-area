// Tells the Staff Hub about an injury report, through its service key (server
// only). Two things appear there with no Staff Hub change:
//  - a member note (type "Injury / health") in the Member Admin record, so the
//    injury history is on hand at check-ins;
//  - when the member asked about therapist services, a general dashboard task
//    for the team to forward to a therapist.
// Text goes in the row, never in logs.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { InjuryNotifier } from './service'
import { injuryNoteBody, therapistTaskTitle } from './rules'

const AUTHOR = 'Members area (injury report)'

export function staffHubInjuryNotifier(client: SupabaseClient): InjuryNotifier {
  async function addNote(memberId: string, body: string) {
    const { error } = await client.from('member_notes').insert({
      gymmaster_member_id: memberId,
      note_type: 'injury_health',
      body,
      sensitive: true,
      author_coach_id: null,
      author_name: AUTHOR,
    })
    if (error) throw new Error('staffhub_note_failed')
  }

  return {
    async reported(row) {
      await addNote(row.gymmaster_member_id, injuryNoteBody(row, 'reported'))
      if (!row.wants_therapist_info) return false
      const { data } = await client.from('gm_member_snapshot').select('full_name').eq('gymmaster_member_id', row.gymmaster_member_id).maybeSingle()
      const { error } = await client.from('coach_tasks').insert({
        coach_id: null,
        title: therapistTaskTitle((data as { full_name?: string } | null)?.full_name ?? null, row),
        due_date: new Date().toISOString().slice(0, 10),
        source: 'injury_report',
        source_key: `injury-${row.id}`,
      })
      if (error) throw new Error('staffhub_task_failed')
      return true
    },
    async resolved(row) {
      await addNote(row.gymmaster_member_id, injuryNoteBody(row, 'resolved'))
    },
  }
}
