'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const TARGET = 12

type CachedMember = {
  gymmaster_member_id: string
  member_name: string
  visits_this_month: number
  updated_at: string
}

type PastWinner = {
  month: string
  member_name: string
  notes: string | null
}

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

export default function CoachCommitmentClub() {
  const now = new Date()
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  const [members, setMembers] = useState<CachedMember[]>([])
  const [pastWinners, setPastWinners] = useState<PastWinner[]>([])
  const [loading, setLoading] = useState(true)
  const [winner, setWinner] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const [cacheResult, awardsResult] = await Promise.all([
        supabase
          .from('member_visit_cache')
          .select('gymmaster_member_id, member_name, visits_this_month, updated_at')
          .order('visits_this_month', { ascending: false }),
        supabase
          .from('member_awards')
          .select('month, member_name, reason')
          .eq('award_type', 'commitment_club')
          .order('month', { ascending: false })
          .limit(6),
      ])

      setMembers(cacheResult.data ?? [])
      setPastWinners(
        (awardsResult.data ?? []).map(r => ({
          month: r.month,
          member_name: r.member_name,
          notes: r.reason,
        }))
      )
      setLoading(false)
    }

    load()
  }, [])

  const qualifiers = members.filter(m => m.visits_this_month >= TARGET)
  const nonQualifiers = members.filter(m => m.visits_this_month < TARGET)

  function handleRandomPick() {
    if (qualifiers.length === 0) return
    const picked = qualifiers[Math.floor(Math.random() * qualifiers.length)]
    setWinner(picked.gymmaster_member_id)
  }

  async function handlePickWinner() {
    if (!winner) return
    const chosen = members.find(m => m.gymmaster_member_id === winner)
    if (!chosen) return

    setSaving(true)
    setSaveError(null)

    const res = await fetch('/api/coach/awards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        award_type: 'commitment_club',
        member_name: chosen.member_name,
        gymmaster_member_id: chosen.gymmaster_member_id,
        month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        reason: notes.trim() || null,
      }),
    })

    setSaving(false)

    if (res.ok) {
      setSaved(true)
      setPastWinners(prev => [{
        month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        member_name: chosen.member_name,
        notes: notes.trim() || null,
      }, ...prev])
    } else {
      const data = await res.json().catch(() => ({}))
      setSaveError(data.error ?? 'Failed to save winner')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Coach</p>
          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
            Commitment<br /><span className="text-brand">Club</span>
          </h1>
        </div>
        <p className="text-sm text-text-secondary">Loading member data…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Coach</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Commitment<br /><span className="text-brand">Club</span>
        </h1>
        <p className="text-text-secondary text-sm">
          {monthName} · {qualifiers.length} member{qualifiers.length !== 1 ? 's' : ''} qualified for the draw
        </p>
      </div>

      {members.length === 0 && (
        <div className="bg-status-amber/10 border border-status-amber/20 rounded-xl px-5 py-4 mb-6 text-sm text-status-amber">
          No visit data yet. Visit counts are recorded when members log in to the Members Area. Once they do, their data will appear here.
        </div>
      )}

      {/* Qualified members */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <h2 className="font-display text-2xl text-text-primary">Qualified ({TARGET}+ visits)</h2>
          <span className="text-xs font-data font-bold text-brand">{qualifiers.length} entrants</span>
        </div>
        {qualifiers.length > 0 ? (
          <div className="divide-y divide-border-light">
            {qualifiers.map(m => (
              <div key={m.gymmaster_member_id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{m.member_name}</p>
                  <p className="text-xs text-text-secondary font-data">{m.visits_this_month} visits</p>
                </div>
                <span className="text-brand text-sm">✓</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-text-secondary">No members have qualified yet this month.</p>
        )}
      </div>

      {/* Pick a winner */}
      {qualifiers.length > 0 && !saved && (
        <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
          <div className="h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="p-5">
            <h2 className="font-display text-2xl text-text-primary mb-1">Pick this month&apos;s winner</h2>
            <p className="text-xs text-text-secondary mb-5">Select manually or let the system pick at random.</p>

            {saveError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                {saveError}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {qualifiers.map(m => (
                <label key={m.gymmaster_member_id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${winner === m.gymmaster_member_id ? 'border-brand/40 bg-brand/5' : 'border-border-light hover:border-brand/20'}`}>
                  <input type="radio" name="winner" value={m.gymmaster_member_id} checked={winner === m.gymmaster_member_id} onChange={() => setWinner(m.gymmaster_member_id)} className="accent-brand" />
                  <span className="text-sm font-medium text-text-primary flex-1">{m.member_name}</span>
                  <span className="text-xs font-data text-text-secondary">{m.visits_this_month} visits</span>
                </label>
              ))}
            </div>

            <button onClick={handleRandomPick} className="w-full py-2.5 rounded-xl border border-border-light text-text-secondary text-sm hover:border-brand/30 hover:text-brand transition-colors mb-3">
              🎲 Pick at random
            </button>

            <div className="mb-4">
              <label className="text-xs text-text-secondary font-medium block mb-1">Prize / notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Won a protein shaker set" className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50" />
            </div>

            <button disabled={!winner || saving} onClick={handlePickWinner} className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : 'Confirm winner & record result'}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5 mb-6 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-semibold text-brand">Winner recorded!</p>
          <p className="text-xs text-text-secondary mt-1">The result has been saved and will appear on the member dashboard.</p>
        </div>
      )}

      {/* Non-qualifiers */}
      {nonQualifiers.length > 0 && (
        <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
          <div className="p-5 border-b border-border-light">
            <h2 className="font-display text-2xl text-text-primary">Not yet qualified</h2>
          </div>
          <div className="divide-y divide-border-light">
            {nonQualifiers.map(m => (
              <div key={m.gymmaster_member_id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{m.member_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-20 h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div className="h-full bg-brand/40 rounded-full" style={{ width: `${Math.min(100, Math.round((m.visits_this_month / TARGET) * 100))}%` }} />
                  </div>
                  <span className="text-xs font-data text-text-secondary w-8 text-right">{m.visits_this_month}/{TARGET}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past winners */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border-light">
          <h2 className="font-display text-2xl text-text-primary">Past winners</h2>
        </div>
        {pastWinners.length === 0 ? (
          <p className="p-5 text-sm text-text-secondary">No winners recorded yet.</p>
        ) : (
          <div className="divide-y divide-border-light">
            {pastWinners.map((w, i) => (
              <div key={i} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{w.member_name}</p>
                  {w.notes && <p className="text-xs text-text-secondary mt-0.5">{w.notes}</p>}
                </div>
                <p className="text-xs text-text-secondary shrink-0">{formatMonth(w.month)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
