'use client'

import { useState, useEffect } from 'react'

type Member = { id: string; name: string }

type Exercise = {
  name: string
  unit: string
  hasNotes: boolean
  notesPlaceholder?: string
  placeholder: string
}

const EXERCISES: Exercise[] = [
  { name: 'Hex Deadlift 3RM',  unit: 'kg',   hasNotes: false, placeholder: 'e.g. 140' },
  { name: 'Back Squat 3RM',    unit: 'kg',   hasNotes: false, placeholder: 'e.g. 100' },
  { name: 'Bench Press 3RM',   unit: 'kg',   hasNotes: false, placeholder: 'e.g. 80' },
  { name: 'Clean & Jerk 1RM',  unit: 'kg',   hasNotes: false, placeholder: 'e.g. 70' },
  { name: 'Snatch 1RM',        unit: 'kg',   hasNotes: false, placeholder: 'e.g. 55' },
  { name: 'Pull Up Max Reps',  unit: 'reps', hasNotes: false, placeholder: 'e.g. 12' },
  { name: '9min AMRAP',        unit: 'reps', hasNotes: true,  placeholder: 'e.g. 87', notesPlaceholder: 'Equipment used, e.g. 10 cal bike, 10 wall balls, 10 box jumps' },
  { name: '6min Time Trial',   unit: 'm',    hasNotes: true,  placeholder: 'e.g. 1450', notesPlaceholder: 'Equipment used, e.g. Row erg' },
  { name: '5km Run',           unit: 'min',  hasNotes: false, placeholder: 'e.g. 24.5 (decimal minutes)' },
  { name: '10km Run',          unit: 'min',  hasNotes: false, placeholder: 'e.g. 52.0 (decimal minutes)' },
]

type RecentEntry = {
  id: string
  member_name: string | null
  gymmaster_member_id: string
  exercise: string
  result_value: number
  result_notes: string | null
  tested_date: string
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function CoachStrengthInputPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].name)
  const [resultValue, setResultValue] = useState('')
  const [resultNotes, setResultNotes] = useState('')
  const [testedDate, setTestedDate] = useState(todayString())

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exercise = EXERCISES.find(e => e.name === selectedExercise) ?? EXERCISES[0]

  async function loadRecentEntries() {
    const res = await fetch('/api/coach/strength')
    if (res.ok) {
      const data = await res.json()
      setRecentEntries(data.entries ?? [])
    }
  }

  useEffect(() => {
    fetch('/api/gymmaster/members')
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))

    loadRecentEntries()
  }, [])

  // Clear notes when switching to an exercise that doesn't need them
  useEffect(() => {
    if (!exercise.hasNotes) setResultNotes('')
  }, [exercise])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const member = members.find(m => m.id === selectedMemberId)

    const res = await fetch('/api/coach/strength', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymmaster_member_id: selectedMemberId,
        member_name: member?.name ?? null,
        exercise: selectedExercise,
        result_value: parseFloat(resultValue),
        result_notes: resultNotes || null,
        tested_date: testedDate,
      }),
    })

    setSaving(false)

    if (res.ok) {
      setSuccess(true)
      setResultValue('')
      setResultNotes('')
      setTimeout(() => setSuccess(false), 4000)
      loadRecentEntries()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save result')
    }
  }

  const inputClass = 'w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data'
  const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5'

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Input Data
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Strength &amp; Conditioning
      </h1>

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-medium px-4 py-3 rounded-xl">
          <span className="text-base">✓</span>
          <span>Result saved successfully.</span>
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
          <span className="text-base">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Entry form */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Member + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Member</label>
                {membersLoading ? (
                  <div className={inputClass + ' text-text-secondary'}>Loading members…</div>
                ) : (
                  <select
                    required
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a member…</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  required
                  value={testedDate}
                  onChange={e => setTestedDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Exercise + Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Exercise</label>
                <select
                  required
                  value={selectedExercise}
                  onChange={e => setSelectedExercise(e.target.value)}
                  className={inputClass}
                >
                  {EXERCISES.map(ex => (
                    <option key={ex.name} value={ex.name}>{ex.name} ({ex.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Result ({exercise.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder={exercise.placeholder}
                  value={resultValue}
                  onChange={e => setResultValue(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notes — only for AMRAP / Time Trial */}
            {exercise.hasNotes && (
              <div>
                <label className={labelClass}>
                  Equipment / Notes <span className="normal-case font-normal text-text-secondary">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={exercise.notesPlaceholder}
                  value={resultNotes}
                  onChange={e => setResultNotes(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || membersLoading}
                className="bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent entries table */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Recent Results</h2>
          </div>
          {recentEntries.length === 0 ? (
            <p className="px-5 py-8 text-sm text-text-secondary text-center">No results recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light bg-bg-main/50">
                    {['Member', 'Date', 'Exercise', 'Result', 'Notes'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {recentEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-bg-main/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary text-sm">
                        {entry.member_name ?? <span className="text-text-secondary text-xs">ID {entry.gymmaster_member_id}</span>}
                      </td>
                      <td className="px-4 py-3 font-data text-text-secondary text-xs whitespace-nowrap">{formatDate(entry.tested_date)}</td>
                      <td className="px-4 py-3 text-text-primary text-xs">{entry.exercise}</td>
                      <td className="px-4 py-3 font-data text-text-primary font-semibold">{entry.result_value}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{entry.result_notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
