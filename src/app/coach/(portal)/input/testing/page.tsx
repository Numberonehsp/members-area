"use client";

import { useState, useEffect } from "react";

// Canonical 10 exercises — mirrors StrengthClient.tsx EXERCISES array exactly
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
  { key: "hex_deadlift_3rm",    name: "Hex Deadlift 3RM",  unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 140" },
  { key: "back_squat_3rm",      name: "Back Squat 3RM",    unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 100" },
  { key: "bench_press_3rm",     name: "Bench Press 3RM",   unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 80" },
  { key: "clean_jerk_1rm",      name: "Clean & Jerk 1RM",  unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 70" },
  { key: "snatch_1rm",          name: "Snatch 1RM",        unit: "kg",   higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 55" },
  { key: "pull_up_max_reps",    name: "Pull Up Max Reps",  unit: "reps", higherIsBetter: true,  hasNotes: false, placeholder: "e.g. 12" },
  { key: "nine_min_amrap",      name: "9min AMRAP",        unit: "reps", higherIsBetter: true,  hasNotes: true,  placeholder: "e.g. 87",   notesPlaceholder: "Equipment used..." },
  { key: "six_min_time_trial",  name: "6min Time Trial",   unit: "m",    higherIsBetter: true,  hasNotes: true,  placeholder: "e.g. 1450", notesPlaceholder: "Equipment used..." },
  { key: "five_km_run",         name: "5km Run",           unit: "min",  higherIsBetter: false, hasNotes: false, placeholder: "e.g. 24.5" },
  { key: "ten_km_run",          name: "10km Run",          unit: "min",  higherIsBetter: false, hasNotes: false, placeholder: "e.g. 52.0" },
];

type GmMember = { id: string; name: string };

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachTestingInputPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [blockInput, setBlockInput] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [results, setResults] = useState<Partial<Record<ExerciseKey, string>>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Partial<Record<ExerciseKey, string>>>({});
  const [testDate, setTestDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // GymMaster member list
  const [gmMembers, setGmMembers] = useState<GmMember[]>([]);
  const [gmLoading, setGmLoading] = useState(true);
  const [gmSearch, setGmSearch] = useState("");

  useEffect(() => {
    fetch("/api/gymmaster/members")
      .then((r) => r.json())
      .then((data) => {
        setGmMembers(data.members ?? []);
        setGmLoading(false);
      })
      .catch(() => setGmLoading(false));
  }, []);

  const filteredMembers = gmSearch.length >= 1
    ? gmMembers.filter((m) => m.name.toLowerCase().includes(gmSearch.toLowerCase())).slice(0, 20)
    : gmMembers.slice(0, 20);

  function handleMemberSelect(id: string) {
    const member = gmMembers.find((m) => m.id === id);
    setSelectedMemberId(id);
    setSelectedMemberName(member?.name ?? "");
    setGmSearch(member?.name ?? "");
  }

  function handleStartEntry() {
    if (!blockInput.trim() || !selectedMemberId) return;
    setStep(2);
    setResults({});
    setExerciseNotes({});
    setNotes("");
    setTestDate(getTodayString());
    setSaved(false);
    setSaveError(null);
  }

  function handleChange() {
    setStep(1);
    setSaved(false);
    setSaveError(null);
  }

  async function handleSave() {
    const entries = EXERCISES
      .map((ex) => {
        const raw = results[ex.key]?.trim();
        if (!raw) return null;
        const value = parseFloat(raw);
        if (isNaN(value)) return null;
        return {
          exercise_name: ex.name,
          value,
          unit: ex.unit,
          higher_is_better: ex.higherIsBetter,
          exercise_notes: ex.hasNotes ? (exerciseNotes[ex.key]?.trim() || null) : null,
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      setSaveError("Enter at least one result before saving.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/coach/strength", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymmaster_member_id: selectedMemberId,
          member_name: selectedMemberName,
          test_date: testDate,
          testing_block: blockInput.trim(),
          notes: notes.trim() || null,
          entries,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setSaved(true);
      setTimeout(() => {
        setStep(1);
        setSelectedMemberId("");
        setSelectedMemberName("");
        setGmSearch("");
        setBlockInput("");
        setResults({});
        setExerciseNotes({});
        setNotes("");
        setSaved(false);
      }, 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Input Data
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        S&amp;C Testing
      </h1>

      {saved && (
        <div className="mb-6 bg-status-green/10 border border-status-green/20 text-status-green rounded-xl px-5 py-3 text-sm font-medium">
          Results saved! ✓
        </div>
      )}
      {saveError && (
        <div className="mb-6 bg-status-red/10 border border-status-red/20 text-status-red rounded-xl px-5 py-3 text-sm font-medium">
          {saveError}
        </div>
      )}

      {step === 1 && (
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden max-w-lg">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-6 py-5 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Step 1 — Select Block &amp; Member</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Testing block */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Testing Block
              </label>
              <input
                type="text"
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                placeholder="e.g. April 2026"
                className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Member search */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Member
              </label>
              {gmLoading ? (
                <p className="text-sm text-text-secondary">Loading members…</p>
              ) : (
                <>
                  <input
                    type="text"
                    value={gmSearch}
                    onChange={(e) => {
                      setGmSearch(e.target.value);
                      setSelectedMemberId("");
                      setSelectedMemberName("");
                    }}
                    placeholder="Search member name…"
                    className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors mb-2"
                  />
                  {gmSearch.length >= 1 && !selectedMemberId && (
                    <ul className="border border-border-light rounded-xl overflow-hidden divide-y divide-border-light max-h-52 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-text-secondary">No members found</li>
                      ) : (
                        filteredMembers.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => handleMemberSelect(m.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-main transition-colors"
                            >
                              {m.name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  {selectedMemberId && (
                    <p className="text-xs text-status-green font-medium">✓ {selectedMemberName}</p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleStartEntry}
              disabled={!blockInput.trim() || !selectedMemberId}
              className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Entry →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden max-w-2xl">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-6 py-4 border-b border-border-light flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-text-primary font-medium">
                Testing block:{" "}
                <span className="text-brand font-semibold">{blockInput}</span>
                <span className="text-text-secondary mx-2">·</span>
                Member:{" "}
                <span className="text-brand font-semibold">{selectedMemberName}</span>
              </p>
            </div>
            <button
              onClick={handleChange}
              className="text-xs text-brand hover:text-brand-dark transition-colors font-medium shrink-0"
            >
              ← Change
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <h2 className="font-semibold text-text-primary text-sm mb-1">Step 2 — Enter Results</h2>
            <p className="text-xs text-text-secondary">Leave blank for exercises not tested. Skip fields don&apos;t apply.</p>

            {/* Exercise rows */}
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
                        <span className="text-[10px] text-text-muted">
                          {ex.higherIsBetter ? "↑ higher" : "↓ lower"}
                        </span>
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

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Test Date
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* General notes */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                General Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any observations, conditions, or context…"
                className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save Results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
