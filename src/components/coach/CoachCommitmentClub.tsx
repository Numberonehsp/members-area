'use client'

import { useState } from 'react'

const TARGET = 12

// Seed data — TODO: replace with getAllMemberVisitsThisMonth() joined with members table
const SEED_MEMBERS = [
  { id: 'm1', name: 'Sarah Johnson',  gymMasterId: '1001', visitCount: 15 },
  { id: 'm2', name: 'Mike Thompson',  gymMasterId: '1002', visitCount: 14 },
  { id: 'm3', name: 'James O\'Brien',  gymMasterId: '1005', visitCount: 13 },
  { id: 'm4', name: 'Emma Roberts',   gymMasterId: '1003', visitCount: 12 },
  { id: 'm5', name: 'Priya Sharma',   gymMasterId: '1004', visitCount: 9 },
  { id: 'm6', name: 'Dan Williams',   gymMasterId: '1006', visitCount: 7 },
  { id: 'm7', name: 'Chloe Davies',   gymMasterId: '1007', visitCount: 3 },
]

const SEED_PAST_WINNERS = [
  { month: '2026-03-01', memberName: 'Mike Thompson',  notes: 'Won a protein shaker set' },
  { month: '2026-02-01', memberName: 'Emma Roberts',   notes: 'Won a gym kit bundle' },
  { month: '2026-01-01', memberName: 'Sarah Johnson',  notes: 'Won a free personal training session' },
]

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

export default function CoachCommitmentClub() {
  const now = new Date()
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  const qualifiers = SEED_MEMBERS.filter(m => m.visitCount >= TARGET)
  const nonQualifiers = SEED_MEMBERS.filter(m => m.visitCount < TARGET)

  const [winner, setWinner] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  function handlePickWinner() {
    if (!winner) return
    // TODO: POST to Supabase commitment_club_winners + member_awards
    setSaved(true)
  }

  function handleRandomPick() {
    const picked = qualifiers[Math.floor(Math.random() * qualifiers.length)]
    setWinner(picked.id)
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">Coach</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          Commitment<br />
          <span className="text-brand">Club</span>
        </h1>
        <p className="text-text-secondary text-sm">
          {monthName} · {qualifiers.length} member{qualifiers.length !== 1 ? 's' : ''} qualified for the draw
        </p>
      </div>

      {/* Qualified members */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <h2 className="font-display text-2xl text-text-primary">Qualified ({TARGET}+ visits)</h2>
          <span className="text-xs font-data font-bold text-brand">{qualifiers.length} entrants</span>
        </div>
        {qualifiers.length > 0 ? (
          <div className="divide-y divide-border-light">
            {qualifiers.sort((a, b) => b.visitCount - a.visitCount).map(m => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{m.name}</p>
                  <p className="text-xs text-text-secondary font-data">{m.visitCount} visits</p>
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
            <h2 className="font-display text-2xl text-text-primary mb-1">Pick this month's winner</h2>
            <p className="text-xs text-text-secondary mb-5">Select manually or let the system pick at random.</p>

            <div className="space-y-3 mb-4">
              {qualifiers.map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  winner === m.id
                    ? 'border-brand/40 bg-brand/5'
                    : 'border-border-light hover:border-brand/20'
                }`}>
                  <input
                    type="radio"
                    name="winner"
                    value={m.id}
                    checked={winner === m.id}
                    onChange={() => setWinner(m.id)}
                    className="accent-brand"
                  />
                  <span className="text-sm font-medium text-text-primary flex-1">{m.name}</span>
                  <span className="text-xs font-data text-text-secondary">{m.visitCount} visits</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleRandomPick}
              className="w-full py-2.5 rounded-xl border border-border-light text-text-secondary text-sm hover:border-brand/30 hover:text-brand transition-colors mb-3"
            >
              🎲 Pick at random
            </button>

            <div className="mb-4">
              <label className="text-xs text-text-secondary font-medium block mb-1">Prize / notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Won a protein shaker set"
                className="w-full bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
              />
            </div>

            <button
              disabled={!winner}
              onClick={handlePickWinner}
              className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm winner & record result
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5 mb-6 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-semibold text-brand">Winner recorded!</p>
          <p className="text-xs text-text-secondary mt-1">The result has been saved and will appear in the member's awards.</p>
        </div>
      )}

      {/* Non-qualifiers */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border-light">
          <h2 className="font-display text-2xl text-text-primary">Not yet qualified</h2>
        </div>
        <div className="divide-y divide-border-light">
          {nonQualifiers.sort((a, b) => b.visitCount - a.visitCount).map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{m.name}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-border-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand/40 rounded-full"
                    style={{ width: `${Math.round((m.visitCount / TARGET) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-data text-text-secondary w-8 text-right">{m.visitCount}/{TARGET}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past winners */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border-light">
          <h2 className="font-display text-2xl text-text-primary">Past winners</h2>
        </div>
        <div className="divide-y divide-border-light">
          {SEED_PAST_WINNERS.map(w => (
            <div key={w.month} className="flex items-start justify-between gap-4 px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-text-primary">{w.memberName}</p>
                {w.notes && <p className="text-xs text-text-secondary mt-0.5">{w.notes}</p>}
              </div>
              <p className="text-xs text-text-secondary shrink-0">{formatMonth(w.month)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
