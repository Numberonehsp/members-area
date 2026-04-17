"use client";

import { useState } from "react";
import Link from "next/link";

const RECENT_BLOCKS = ["April 2026", "January 2026", "October 2025"];

const MEMBERS = [
  { id: 1, name: "Alex Johnson" },
  { id: 2, name: "Sam Davies" },
  { id: 3, name: "Jordan Williams" },
  { id: 4, name: "Casey Roberts" },
  { id: 5, name: "Morgan Evans" },
  { id: 6, name: "Priya Sharma" },
  { id: 7, name: "Tom Hughes" },
];

type TestKey = "squat" | "deadlift" | "strictPress" | "row" | "pullUp" | "bench";

const TEST_TYPES: { key: TestKey; label: string; unit: string }[] = [
  { key: "squat", label: "Back Squat", unit: "kg" },
  { key: "deadlift", label: "Deadlift", unit: "kg" },
  { key: "strictPress", label: "Strict Press", unit: "kg" },
  { key: "row", label: "500m Row", unit: "seconds" },
  { key: "pullUp", label: "Pull-Up Max", unit: "reps" },
  { key: "bench", label: "1RM Bench Press", unit: "kg" },
];

// Seed PBs — keyed by member id
const SEED_PBS: Record<number, Record<TestKey, number>> = {
  1: { squat: 120, deadlift: 160, strictPress: 60, row: 95, pullUp: 12, bench: 90 },
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachTestingInputPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [blockInput, setBlockInput] = useState("April 2026");
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [results, setResults] = useState<Partial<Record<TestKey, string>>>({});
  const [testDate, setTestDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedMember = MEMBERS.find((m) => m.id === selectedMemberId);
  const memberPBs: Partial<Record<TestKey, number>> = selectedMemberId ? SEED_PBS[selectedMemberId] ?? {} : {};

  function handleStartEntry() {
    if (!blockInput.trim() || !selectedMemberId) return;
    setStep(2);
    setResults({});
    setNotes("");
    setTestDate(getTodayString());
    setSaved(false);
  }

  function handleChange() {
    setStep(1);
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    // Reset after short delay
    setTimeout(() => {
      setStep(1);
      setSelectedMemberId("");
      setBlockInput("April 2026");
      setResults({});
      setNotes("");
      setSaved(false);
    }, 2000);
  }

  function isNewPB(key: TestKey, value: string): boolean {
    const num = parseFloat(value);
    if (isNaN(num) || !value) return false;
    const pb = memberPBs[key];
    if (pb === undefined) return false;
    // For row (lower is better), new PB if less than existing
    if (key === "row") return num < pb;
    return num > pb;
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
                className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors mb-2"
              />
              <div className="flex flex-wrap gap-2">
                {RECENT_BLOCKS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBlockInput(b)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
                      blockInput === b
                        ? "bg-brand/10 border-brand/40 text-brand"
                        : "bg-bg-main border-border-light text-text-secondary hover:border-brand/40 hover:text-brand"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Member selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Member
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : "")}
                className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Select a member…</option>
                {MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
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

      {step === 2 && selectedMember && (
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden max-w-2xl">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-6 py-4 border-b border-border-light flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-text-primary font-medium">
                Testing block:{" "}
                <span className="text-brand font-semibold">{blockInput}</span>
                <span className="text-text-secondary mx-2">·</span>
                Member:{" "}
                <span className="text-brand font-semibold">{selectedMember.name}</span>
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

            {/* Test rows */}
            <div className="space-y-3">
              {TEST_TYPES.map(({ key, label, unit }) => {
                const val = results[key] ?? "";
                const newPB = isNewPB(key, val);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-36 shrink-0">
                      <span className="text-sm text-text-primary font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => setResults((r) => ({ ...r, [key]: e.target.value }))}
                        placeholder="—"
                        min={0}
                        className="w-24 text-sm bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary font-data placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors text-right"
                      />
                      <span className="text-xs text-text-secondary w-14 shrink-0">{unit}</span>
                      {newPB && (
                        <span className="text-xs font-semibold text-status-green bg-status-green/10 border border-status-green/20 px-2 py-0.5 rounded-full">
                          🏆 New PB!
                        </span>
                      )}
                    </div>
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

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Notes
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
              className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Save Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
