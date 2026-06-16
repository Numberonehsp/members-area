"use client";

import { useState, useEffect, useCallback } from "react";

type ExerciseKey =
  | "hex_deadlift_3rm"
  | "back_squat_3rm"
  | "bench_press_3rm"
  | "clean_jerk_1rm"
  | "snatch_1rm"
  | "pull_up_max_reps"
  | "nine_min_amrap"
  | "six_min_time_trial"
  | "five_km_run"
  | "ten_km_run";

type Exercise = {
  key: ExerciseKey;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  hasNotes: boolean;
  placeholder: string;
  notesPlaceholder?: string;
};

const EXERCISES: Exercise[] = [
  { key: "hex_deadlift_3rm",   name: "Hex Deadlift 3RM",  unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 140" },
  { key: "back_squat_3rm",     name: "Back Squat 3RM",    unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 100" },
  { key: "bench_press_3rm",    name: "Bench Press 3RM",   unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 80"  },
  { key: "clean_jerk_1rm",     name: "Clean & Jerk 1RM",  unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 70"  },
  { key: "snatch_1rm",         name: "Snatch 1RM",        unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 55"  },
  { key: "pull_up_max_reps",   name: "Pull Up Max Reps",  unit: "reps", higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 12"  },
  { key: "nine_min_amrap",     name: "9min AMRAP",        unit: "reps", higherIsBetter: true,  hasNotes: true,  placeholder: "e.g. 87",   notesPlaceholder: "Equipment used…" },
  { key: "six_min_time_trial", name: "6min Time Trial",   unit: "m",    higherIsBetter: true,  hasNotes: true,  placeholder: "e.g. 1450", notesPlaceholder: "Equipment used…" },
  { key: "five_km_run",        name: "5km Run",           unit: "min",  higherIsBetter: false, hasNotes: false, placeholder: "e.g. 24.5" },
  { key: "ten_km_run",         name: "10km Run",          unit: "min",  higherIsBetter: false, hasNotes: false, placeholder: "e.g. 52.0" },
];

type GmMember = { id: string; name: string };

type QueueMember = GmMember & { done: boolean };

type RecentResult = {
  id: string;
  gymmaster_member_id: string;
  member_name: string | null;
  exercise: string;
  result_value: number;
  result_notes: string | null;
  tested_date: string;
};

type Step = 1 | 2;

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachTestingInputPage() {
  const [step, setStep] = useState<Step>(1);
  const [activeView, setActiveView] = useState<"entry" | "history">("entry");

  // Session-level
  const [blockInput, setBlockInput] = useState("");
  const [testDate, setTestDate]     = useState(getTodayString());

  // Member queue (pre-selected at session setup)
  const [queueSearch, setQueueSearch]   = useState("");
  const [memberQueue, setMemberQueue]   = useState<QueueMember[]>([]);
  const [activeQueueIdx, setActiveQueueIdx] = useState(0);

  // Per-member (single-member mode when no queue)
  const [selectedMemberId, setSelectedMemberId]     = useState("");
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [gmSearch, setGmSearch]                     = useState("");
  const [results, setResults]                       = useState<Partial<Record<ExerciseKey, string>>>({});
  const [exerciseNotes, setExerciseNotes]           = useState<Partial<Record<ExerciseKey, string>>>({});
  const [sessionNotes, setSessionNotes]             = useState("");

  // UI state
  const [saving, setSaving]       = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // GymMaster members
  const [gmMembers, setGmMembers] = useState<GmMember[]>([]);
  const [gmLoading, setGmLoading] = useState(true);

  // Recent results
  const [recent, setRecent]               = useState<RecentResult[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gymmaster/members")
      .then((r) => r.json())
      .then((data) => { setGmMembers(data.members ?? []); setGmLoading(false); })
      .catch(() => setGmLoading(false));
  }, []);

  const loadRecent = useCallback(() => {
    setRecentLoading(true);
    fetch("/api/coach/strength")
      .then((r) => r.json())
      .then((data) => { setRecent(data.entries ?? []); setRecentLoading(false); })
      .catch(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    if (activeView === "history") loadRecent();
  }, [activeView, loadRecent]);

  // Derived: active member in queue mode
  const isQueueMode = memberQueue.length > 0;
  const activeMember: GmMember | null = isQueueMode
    ? { id: memberQueue[activeQueueIdx]?.id, name: memberQueue[activeQueueIdx]?.name }
    : selectedMemberId ? { id: selectedMemberId, name: selectedMemberName } : null;

  function addToQueue(m: GmMember) {
    if (memberQueue.some((q) => q.id === m.id)) return;
    setMemberQueue((prev) => [...prev, { ...m, done: false }]);
    setQueueSearch("");
  }

  function removeFromQueue(id: string) {
    setMemberQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function startSession() {
    if (!blockInput.trim()) return;
    setStep(2);
    setActiveQueueIdx(0);
    resetInputs();
  }

  function endSession() {
    setStep(1);
    setBlockInput("");
    setTestDate(getTodayString());
    setMemberQueue([]);
    setQueueSearch("");
    resetInputs();
  }

  function resetInputs() {
    setSelectedMemberId("");
    setSelectedMemberName("");
    setGmSearch("");
    setResults({});
    setExerciseNotes({});
    setSessionNotes("");
    setSaveError(null);
    setJustSaved(null);
  }

  function switchQueueMember(idx: number) {
    setActiveQueueIdx(idx);
    resetInputs();
  }

  async function handleSave() {
    const currentId   = isQueueMode ? memberQueue[activeQueueIdx]?.id   : selectedMemberId;
    const currentName = isQueueMode ? memberQueue[activeQueueIdx]?.name : selectedMemberName;

    const entries = EXERCISES
      .map((ex) => {
        const raw = results[ex.key]?.trim();
        if (!raw) return null;
        const value = parseFloat(raw);
        if (isNaN(value)) return null;
        return {
          exercise: ex.name,
          result_value: value,
          exercise_notes: ex.hasNotes ? (exerciseNotes[ex.key]?.trim() || null) : null,
        };
      })
      .filter(Boolean);

    if (!currentId) { setSaveError("Please select a member."); return; }
    if (entries.length === 0) { setSaveError("Enter at least one result before saving."); return; }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/coach/strength", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymmaster_member_id: currentId,
          member_name: currentName,
          tested_date: testDate,
          testing_block: blockInput.trim(),
          notes: sessionNotes.trim() || null,
          entries,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setJustSaved(currentName);

      if (isQueueMode) {
        // Mark this member done in the queue
        setMemberQueue((prev) =>
          prev.map((q, i) => (i === activeQueueIdx ? { ...q, done: true } : q))
        );
        // Auto-advance to next undone member after a brief pause
        setTimeout(() => {
          const nextIdx = memberQueue.findIndex((q, i) => i > activeQueueIdx && !q.done);
          if (nextIdx !== -1) {
            setActiveQueueIdx(nextIdx);
            resetInputs();
          } else {
            // All done — stay, show completion state
            setJustSaved(currentName);
          }
        }, 1400);
      } else {
        setTimeout(() => resetInputs(), 1800);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/coach/strength", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setRecent((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const queueFilteredMembers = queueSearch.length >= 1
    ? gmMembers
        .filter((m) => m.name.toLowerCase().includes(queueSearch.toLowerCase()) && !memberQueue.some((q) => q.id === m.id))
        .slice(0, 10)
    : [];

  const filteredMembers = gmSearch.length >= 1
    ? gmMembers.filter((m) => m.name.toLowerCase().includes(gmSearch.toLowerCase())).slice(0, 20)
    : [];

  function selectMember(m: GmMember) {
    setSelectedMemberId(m.id);
    setSelectedMemberName(m.name);
    setGmSearch(m.name);
  }

  const allQueueDone = isQueueMode && memberQueue.every((q) => q.done);
  const doneCount    = memberQueue.filter((q) => q.done).length;

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Input Data
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-6">
        S&amp;C Testing
      </h1>

      {/* View toggle */}
      <div className="flex gap-1 mb-6 bg-bg-card border border-border-light rounded-xl p-1 w-fit">
        {(["entry", "history"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === v
                ? "bg-brand/10 text-brand border border-brand/30"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {v === "entry" ? "Enter Results" : "Recent Results"}
          </button>
        ))}
      </div>

      {/* ── Entry view ─────────────────────────────────────────────────────── */}
      {activeView === "entry" && (
        <>
          {step === 1 && (
            <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden max-w-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
              <div className="px-6 py-5 border-b border-border-light">
                <h2 className="font-semibold text-text-primary text-sm">Set up testing session</h2>
                <p className="text-xs text-text-secondary mt-1">These apply to all members in this session.</p>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Testing Block</label>
                  <input
                    type="text"
                    value={blockInput}
                    onChange={(e) => setBlockInput(e.target.value)}
                    placeholder="e.g. June 2026"
                    className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Test Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>

                {/* Member queue */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Members in this session <span className="text-text-muted font-normal normal-case tracking-normal">(optional — add now or one at a time)</span>
                  </label>
                  {gmLoading ? (
                    <p className="text-xs text-text-secondary">Loading members…</p>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                        placeholder="Search and add members…"
                        className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                      />
                      {queueSearch.length >= 1 && (
                        <ul className="absolute z-10 top-full left-0 right-0 mt-1 border border-border-light rounded-xl overflow-hidden divide-y divide-border-light max-h-48 overflow-y-auto bg-bg-card shadow-lg">
                          {queueFilteredMembers.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-text-secondary">No members found</li>
                          ) : queueFilteredMembers.map((m) => (
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
                      {memberQueue.map((m) => (
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
                  disabled={!blockInput.trim()}
                  className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Session →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 max-w-2xl">
              {/* Session bar */}
              <div className="bg-bg-card border border-border-light rounded-xl px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {blockInput}
                    <span className="text-text-secondary font-normal mx-2">·</span>
                    <span className="text-text-secondary font-normal text-xs">
                      {new Date(testDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </p>
                  {isQueueMode && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      {doneCount}/{memberQueue.length} members saved
                    </p>
                  )}
                </div>
                <button
                  onClick={endSession}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors font-medium shrink-0 border border-border-light rounded-lg px-3 py-1.5"
                >
                  End Session
                </button>
              </div>

              {/* Queue member tabs */}
              {isQueueMode && (
                <div className="flex gap-2 flex-wrap">
                  {memberQueue.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => switchQueueMember(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                        i === activeQueueIdx
                          ? "bg-brand/10 text-brand border-brand/30"
                          : m.done
                          ? "bg-status-green/10 text-status-green border-status-green/20"
                          : "bg-bg-card text-text-secondary border-border-light hover:text-text-primary"
                      }`}
                    >
                      {m.done && <span>✓</span>}
                      {m.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* All done banner */}
              {allQueueDone && (
                <div className="bg-status-green/10 border border-status-green/20 text-status-green rounded-xl px-5 py-3 text-sm font-medium flex items-center justify-between">
                  <span>✓ All {memberQueue.length} members saved!</span>
                  <button onClick={endSession} className="text-xs bg-status-green text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                    End Session
                  </button>
                </div>
              )}

              {justSaved && !allQueueDone && (
                <div className="bg-status-green/10 border border-status-green/20 text-status-green rounded-xl px-5 py-3 text-sm font-medium">
                  ✓ {justSaved} saved{isQueueMode ? " — moving to next member" : " — ready for next member"}
                </div>
              )}

              {saveError && (
                <div className="bg-status-red/10 border border-status-red/20 text-status-red rounded-xl px-5 py-3 text-sm font-medium">
                  {saveError}
                </div>
              )}

              {!allQueueDone && (
                <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

                  {/* Member selector — only shown in single-member mode */}
                  {!isQueueMode && (
                    <div className="px-6 py-5 border-b border-border-light">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Member</label>
                      {gmLoading ? (
                        <p className="text-sm text-text-secondary">Loading members…</p>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={gmSearch}
                            onChange={(e) => { setGmSearch(e.target.value); setSelectedMemberId(""); setSelectedMemberName(""); }}
                            placeholder="Search member name…"
                            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors mb-2"
                          />
                          {gmSearch.length >= 1 && !selectedMemberId && (
                            <ul className="border border-border-light rounded-xl overflow-hidden divide-y divide-border-light max-h-52 overflow-y-auto">
                              {filteredMembers.length === 0 ? (
                                <li className="px-4 py-3 text-sm text-text-secondary">No members found</li>
                              ) : filteredMembers.map((m) => (
                                <li key={m.id}>
                                  <button type="button" onClick={() => selectMember(m)} className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-main transition-colors">
                                    {m.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {selectedMemberId && <p className="text-xs text-status-green font-medium">✓ {gmSearch}</p>}
                        </>
                      )}
                    </div>
                  )}

                  {/* Queue member header */}
                  {isQueueMode && memberQueue[activeQueueIdx] && (
                    <div className="px-6 py-4 border-b border-border-light">
                      <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Entering results for</p>
                      <p className="font-semibold text-text-primary">{memberQueue[activeQueueIdx].name}</p>
                    </div>
                  )}

                  <div className="px-6 py-5 space-y-4">
                    <p className="text-xs text-text-secondary">Leave blank for exercises not tested.</p>
                    <div className="space-y-3">
                      {EXERCISES.map((ex) => {
                        const val = results[ex.key] ?? "";
                        return (
                          <div key={ex.key} className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <div className="w-40 shrink-0">
                                <span className="text-sm text-text-primary font-medium">{ex.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => setResults((r) => ({ ...r, [ex.key]: e.target.value }))}
                                  placeholder={ex.placeholder}
                                  min={0}
                                  step="0.1"
                                  className="w-28 text-sm bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary font-data placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors text-right"
                                />
                                <span className="text-xs text-text-secondary w-10 shrink-0">{ex.unit}</span>
                                <span className="text-[10px] text-text-muted">{ex.higherIsBetter ? "↑ higher" : "↓ lower"}</span>
                              </div>
                            </div>
                            {ex.hasNotes && val && (
                              <div className="ml-40 pl-3">
                                <input
                                  type="text"
                                  value={exerciseNotes[ex.key] ?? ""}
                                  onChange={(e) => setExerciseNotes((n) => ({ ...n, [ex.key]: e.target.value }))}
                                  placeholder={ex.notesPlaceholder ?? "Notes…"}
                                  className="w-full text-xs bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <hr className="border-border-light" />

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Notes (optional)</label>
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        rows={2}
                        placeholder="Any observations, conditions, or context…"
                        className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={saving || (!isQueueMode && !selectedMemberId)}
                      className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving
                        ? "Saving…"
                        : isQueueMode
                        ? `Save ${memberQueue[activeQueueIdx]?.name.split(" ")[0]} →`
                        : "Save & Next Member →"
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── History / delete view ──────────────────────────────────────────── */}
      {activeView === "history" && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">Last 50 results.</p>
            <button onClick={loadRecent} className="text-xs text-brand hover:opacity-80 transition-opacity font-medium">
              Refresh
            </button>
          </div>

          {recentLoading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-text-secondary">No results yet.</p>
          ) : (
            <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden">
              <div className="divide-y divide-border-light">
                {recent.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {r.member_name ?? "Unknown"}{" "}
                        <span className="text-text-secondary font-normal">— {r.exercise}</span>
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        <span className="font-data font-semibold text-text-primary">{r.result_value}</span>
                        {r.result_notes && <span className="ml-2 text-text-muted">({r.result_notes})</span>}
                        <span className="ml-3">
                          {new Date(r.tested_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="text-text-muted hover:text-status-red transition-colors shrink-0 disabled:opacity-40 p-1"
                      title="Delete entry"
                    >
                      {deletingId === r.id ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
