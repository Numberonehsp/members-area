'use client'

import { useState, useEffect } from 'react'

// ─── Shared exercise list ─────────────────────────────────────────────────────

type Exercise = {
  key: string
  name: string
  unit: string
  higherIsBetter: boolean
  hasNotes: boolean
  placeholder: string
  notesPlaceholder?: string
}

const EXERCISES: Exercise[] = [
  { key: 'hex_deadlift_3rm',        name: 'Hex Deadlift 3RM',   unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 140' },
  { key: 'back_squat_3rm',          name: 'Back Squat 3RM',     unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 100' },
  { key: 'bench_press_3rm',         name: 'Bench Press 3RM',    unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 80' },
  { key: 'clean_jerk_1rm',          name: 'Clean & Jerk 1RM',   unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 70' },
  { key: 'snatch_1rm',              name: 'Snatch 1RM',         unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 55' },
  { key: 'pull_up_max_reps',        name: 'Pull Up Max Reps',   unit: 'reps', higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 12' },
  { key: 'pull_up_3rm',             name: 'Pull Up 3RM',        unit: 'kg',   higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 15' },
  { key: 'nine_min_amrap',          name: '9min AMRAP',         unit: 'reps', higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 87',   notesPlaceholder: 'Equipment used, e.g. 10 cal bike, 10 wall balls, 10 box jumps' },
  { key: 'six_min_time_trial',      name: '6min Time Trial',    unit: 'm',    higherIsBetter: true,  hasNotes: true,  placeholder: 'e.g. 1450', notesPlaceholder: 'Equipment used, e.g. Row erg' },
  { key: 'watt_bike_time_trial',    name: 'Watt Bike 6min',     unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 3500' },
  { key: 'assault_bike_time_trial', name: 'Assault Bike 6min',  unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 3200' },
  { key: 'row_ski_time_trial',      name: 'Row/Ski 6min',       unit: 'm',    higherIsBetter: true,  hasNotes: false, placeholder: 'e.g. 1800' },
  { key: 'five_km_run',             name: '5km Run',            unit: 'min',  higherIsBetter: false, hasNotes: false, placeholder: 'e.g. 24.5 (decimal minutes)' },
  { key: 'ten_km_run',              name: '10km Run',           unit: 'min',  higherIsBetter: false, hasNotes: false, placeholder: 'e.g. 52.0 (decimal minutes)' },
]

type Member = { id: string; name: string }

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

const inputClass = 'w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data'
const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5'

// ─── Tab 1: Quick Entry ────────────────────────────────────────────────────────

function QuickEntryTab() {
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const exercise = EXERCISES.find(e => e.name === selectedExercise) ?? EXERCISES[0]

  async function loadRecentEntries() {
    const res = await fetch('/api/coach/strength')
    if (res.ok) {
      const data = await res.json()
      setRecentEntries(data.entries ?? [])
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch('/api/coach/strength', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setRecentEntries(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeletingId(null)
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

  function resolveName(entry: RecentEntry): string {
    if (entry.member_name) return entry.member_name
    const match = members.find(m => m.id === entry.gymmaster_member_id)
    return match ? match.name : `ID ${entry.gymmaster_member_id}`
  }

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

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-3 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-medium px-4 py-3 rounded-xl">
          <span>✓</span><span>Result saved successfully.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
          <span>✕</span><span>{error}</span>
        </div>
      )}

      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Member</label>
                {membersLoading ? (
                  <div className={inputClass + ' text-text-secondary'}>Loading members…</div>
                ) : (
                  <select required value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className={inputClass}>
                    <option value="">Select a member…</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" required value={testedDate} onChange={e => setTestedDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Exercise</label>
                <select required value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className={inputClass}>
                  {EXERCISES.map(ex => <option key={ex.name} value={ex.name}>{ex.name} ({ex.unit})</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Result ({exercise.unit})</label>
                <input type="number" step="0.1" min="0" required placeholder={exercise.placeholder} value={resultValue} onChange={e => setResultValue(e.target.value)} className={inputClass} />
              </div>
            </div>

            {exercise.hasNotes && (
              <div>
                <label className={labelClass}>Equipment / Notes <span className="normal-case font-normal text-text-secondary">(optional)</span></label>
                <input type="text" placeholder={exercise.notesPlaceholder} value={resultNotes} onChange={e => setResultNotes(e.target.value)} className={inputClass} />
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={saving || membersLoading} className="bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                {saving ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
                    {['Member', 'Date', 'Exercise', 'Result', 'Notes', ''].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {recentEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-bg-main/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary text-sm">
                        {resolveName(entry)}
                      </td>
                      <td className="px-4 py-3 font-data text-text-secondary text-xs whitespace-nowrap">{formatDate(entry.tested_date)}</td>
                      <td className="px-4 py-3 text-text-primary text-xs">{entry.exercise}</td>
                      <td className="px-4 py-3 font-data text-text-primary font-semibold">{entry.result_value}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{entry.result_notes ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-text-muted hover:text-status-red transition-colors disabled:opacity-40"
                          title="Delete entry"
                        >
                          {deletingId === entry.id ? (
                            <span className="text-xs">…</span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          )}
                        </button>
                      </td>
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

// ─── Tab 2: Testing Block ──────────────────────────────────────────────────────

type QueueMember = Member & { done: boolean }

function TestingBlockTab() {
  const [step, setStep] = useState<1 | 2>(1)
  const [blockInput, setBlockInput] = useState('')
  const [testDate, setTestDate] = useState(todayString())

  // Queue
  const [memberQueue, setMemberQueue] = useState<QueueMember[]>([])
  const [queueSearch, setQueueSearch] = useState('')
  const [activeQueueIdx, setActiveQueueIdx] = useState(0)

  // Per-member entry
  const [results, setResults] = useState<Partial<Record<string, string>>>({})
  const [exerciseNotes, setExerciseNotes] = useState<Partial<Record<string, string>>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [gmMembers, setGmMembers] = useState<Member[]>([])
  const [gmLoading, setGmLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gymmaster/members')
      .then(r => r.json())
      .then(data => { setGmMembers(data.members ?? []); setGmLoading(false) })
      .catch(() => setGmLoading(false))
  }, [])

  const queueFiltered = queueSearch.length >= 1
    ? gmMembers.filter(m => m.name.toLowerCase().includes(queueSearch.toLowerCase()) && !memberQueue.some(q => q.id === m.id)).slice(0, 10)
    : []

  function addToQueue(m: Member) {
    setMemberQueue(prev => [...prev, { ...m, done: false }])
    setQueueSearch('')
  }

  function removeFromQueue(id: string) {
    setMemberQueue(prev => prev.filter(q => q.id !== id))
  }

  function resetInputs() {
    setResults({})
    setExerciseNotes({})
    setNotes('')
    setSaveError(null)
    setJustSaved(null)
  }

  function startSession() {
    if (!blockInput.trim() || memberQueue.length === 0) return
    setActiveQueueIdx(0)
    resetInputs()
    setStep(2)
  }

  function endSession() {
    setStep(1)
    setBlockInput('')
    setTestDate(todayString())
    setMemberQueue([])
    setQueueSearch('')
    resetInputs()
  }

  function switchMember(idx: number) {
    setActiveQueueIdx(idx)
    resetInputs()
  }

  async function handleSave() {
    const current = memberQueue[activeQueueIdx]
    const entries = EXERCISES
      .map(ex => {
        const raw = results[ex.key]?.trim()
        if (!raw) return null
        const value = parseFloat(raw)
        if (isNaN(value)) return null
        return {
          exercise: ex.name,
          result_value: value,
          exercise_notes: ex.hasNotes ? (exerciseNotes[ex.key]?.trim() || null) : null,
        }
      })
      .filter(Boolean)

    if (entries.length === 0) { setSaveError('Enter at least one result before saving.'); return }

    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch('/api/coach/strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymmaster_member_id: current.id,
          member_name: current.name,
          tested_date: testDate,
          testing_block: blockInput.trim(),
          notes: notes.trim() || null,
          entries,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      setJustSaved(current.name)
      setMemberQueue(prev => prev.map((q, i) => i === activeQueueIdx ? { ...q, done: true } : q))

      setTimeout(() => {
        const nextIdx = memberQueue.findIndex((q, i) => i > activeQueueIdx && !q.done)
        if (nextIdx !== -1) {
          setActiveQueueIdx(nextIdx)
          resetInputs()
        } else {
          setJustSaved(current.name)
        }
      }, 1400)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const allDone = memberQueue.length > 0 && memberQueue.every(q => q.done)
  const doneCount = memberQueue.filter(q => q.done).length
  const current = memberQueue[activeQueueIdx]

  return (
    <div className="space-y-4">
      {step === 1 && (
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden max-w-lg">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-6 py-5 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Step 1 — Set Up Session</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Testing Block</label>
              <input type="text" value={blockInput} onChange={e => setBlockInput(e.target.value)} placeholder="e.g. June 2026" className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Test Date</label>
              <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Members in this session</label>
              {gmLoading ? (
                <p className="text-sm text-text-secondary">Loading members…</p>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={e => setQueueSearch(e.target.value)}
                    placeholder="Search and add members…"
                    className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                  />
                  {queueSearch.length >= 1 && (
                    <ul className="absolute z-10 top-full left-0 right-0 mt-1 border border-border-light rounded-xl overflow-hidden divide-y divide-border-light max-h-48 overflow-y-auto bg-bg-card shadow-lg">
                      {queueFiltered.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-text-secondary">No members found</li>
                      ) : queueFiltered.map(m => (
                        <li key={m.id}>
                          <button type="button" onClick={() => addToQueue(m)} className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-main transition-colors">
                            {m.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {memberQueue.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {memberQueue.map(m => (
                    <li key={m.id} className="flex items-center justify-between bg-bg-main border border-border-light rounded-lg px-3 py-1.5">
                      <span className="text-sm text-text-primary">{m.name}</span>
                      <button onClick={() => removeFromQueue(m.id)} className="text-text-muted hover:text-status-red transition-colors text-lg leading-none">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={startSession}
              disabled={!blockInput.trim() || memberQueue.length === 0}
              className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Session →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 max-w-2xl">
          {/* Session bar */}
          <div className="bg-bg-card border border-border-light rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {blockInput}
                <span className="text-text-secondary font-normal mx-2">·</span>
                <span className="text-text-secondary font-normal text-xs">
                  {new Date(testDate + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{doneCount}/{memberQueue.length} members saved</p>
            </div>
            <button onClick={endSession} className="text-xs text-text-secondary hover:text-text-primary transition-colors font-medium shrink-0 border border-border-light rounded-lg px-3 py-1.5">
              End Session
            </button>
          </div>

          {/* Member tabs */}
          <div className="flex gap-2 flex-wrap">
            {memberQueue.map((m, i) => (
              <button
                key={m.id}
                onClick={() => switchMember(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  i === activeQueueIdx
                    ? 'bg-brand/10 text-brand border-brand/30'
                    : m.done
                    ? 'bg-status-green/10 text-status-green border-status-green/20'
                    : 'bg-bg-card text-text-secondary border-border-light hover:text-text-primary'
                }`}
              >
                {m.done && <span>✓</span>}
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {allDone && (
            <div className="bg-status-green/10 border border-status-green/20 text-status-green rounded-xl px-5 py-3 text-sm font-medium flex items-center justify-between">
              <span>✓ All {memberQueue.length} members saved!</span>
              <button onClick={endSession} className="text-xs bg-status-green text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                End Session
              </button>
            </div>
          )}

          {justSaved && !allDone && (
            <div className="bg-status-green/10 border border-status-green/20 text-status-green rounded-xl px-5 py-3 text-sm font-medium">
              ✓ {justSaved} saved — moving to next member
            </div>
          )}

          {saveError && (
            <div className="bg-status-red/10 border border-status-red/20 text-status-red rounded-xl px-5 py-3 text-sm font-medium">
              {saveError}
            </div>
          )}

          {!allDone && current && (
            <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
              <div className="px-6 py-4 border-b border-border-light">
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Entering results for</p>
                <p className="font-semibold text-text-primary">{current.name}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-text-secondary">Leave blank for exercises not tested.</p>
                <div className="space-y-3">
                  {EXERCISES.map(ex => {
                    const val = results[ex.key] ?? ''
                    return (
                      <div key={ex.key} className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-40 shrink-0">
                            <span className="text-sm text-text-primary font-medium">{ex.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <input type="number" value={val} onChange={e => setResults(r => ({ ...r, [ex.key]: e.target.value }))} placeholder={ex.placeholder} min={0} step="0.1" className="w-28 text-sm bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary font-data placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors text-right" />
                            <span className="text-xs text-text-secondary w-10 shrink-0">{ex.unit}</span>
                            <span className="text-[10px] text-text-muted">{ex.higherIsBetter ? '↑ higher' : '↓ lower'}</span>
                          </div>
                        </div>
                        {ex.hasNotes && val && (
                          <div className="ml-40 pl-3">
                            <input type="text" value={exerciseNotes[ex.key] ?? ''} onChange={e => setExerciseNotes(n => ({ ...n, [ex.key]: e.target.value }))} placeholder={ex.notesPlaceholder ?? 'Notes…'} className="w-full text-xs bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <hr className="border-border-light" />
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">General Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any observations, conditions, or context…" className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none" />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : `Save ${current.name.split(' ')[0]} →`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachSandCPage() {
  const [activeTab, setActiveTab] = useState<'quick' | 'block'>('quick')

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Input Data</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-6">
        Strength &amp; Conditioning
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-bg-card border border-border-light rounded-xl p-1 w-fit">
        {([
          { key: 'quick', label: 'Quick Entry' },
          { key: 'block', label: 'Testing Block' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'quick' && <QuickEntryTab />}
      {activeTab === 'block' && <TestingBlockTab />}
    </div>
  )
}
