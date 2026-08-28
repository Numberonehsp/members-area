"use client";

import { useState, useEffect } from "react";

export type EditableStrengthResult = {
  id: string;
  exercise: string;
  result_value: number;
  result_notes: string | null;
  tested_date: string;
};

type Props = {
  result: EditableStrengthResult;
  exerciseOptions: string[];
  onClose: () => void;
  onSaved: () => void;
};

export default function EditStrengthResultModal({ result, exerciseOptions, onClose, onSaved }: Props) {
  const [exercise, setExercise] = useState(result.exercise);
  const [value, setValue] = useState(String(result.result_value));
  const [date, setDate] = useState(result.tested_date);
  const [notes, setNotes] = useState(result.result_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/strength", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result.id,
          exercise,
          result_value: parseFloat(value),
          result_notes: notes || null,
          tested_date: date,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to save");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-bg-card border border-border-light rounded-2xl p-6 w-full max-w-sm space-y-4"
      >
        <h2 className="font-semibold text-text-primary text-sm">Edit result</h2>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Exercise</span>
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
          >
            {(exerciseOptions.includes(exercise) ? exerciseOptions : [exercise, ...exerciseOptions]).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Result value</span>
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Tested date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Notes</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
          />
        </label>

        {error && <p className="text-xs text-status-red">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary rounded-xl hover:bg-bg-main transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
