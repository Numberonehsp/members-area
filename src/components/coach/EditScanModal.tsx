"use client";

import { useState, useEffect } from "react";

export type EditableScan = {
  id: string;
  scan_date: string;
  weight: number | null;
  smm: number | null;
  bf_pct: number | null;
  bf_mass: number | null;
  notes: string | null;
};

type Props = {
  scan: EditableScan;
  onClose: () => void;
  onSaved: () => void;
};

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export default function EditScanModal({ scan, onClose, onSaved }: Props) {
  const [date, setDate] = useState(scan.scan_date);
  const [weight, setWeight] = useState(scan.weight?.toString() ?? "");
  const [smm, setSmm] = useState(scan.smm?.toString() ?? "");
  const [bfPct, setBfPct] = useState(scan.bf_pct?.toString() ?? "");
  const [bfMass, setBfMass] = useState(scan.bf_mass?.toString() ?? "");
  const [notes, setNotes] = useState(scan.notes ?? "");
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
      const res = await fetch("/api/inbody", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scan.id,
          scan_date: date,
          weight: numOrNull(weight),
          smm: numOrNull(smm),
          bf_pct: numOrNull(bfPct),
          bf_mass: numOrNull(bfMass),
          notes: notes || null,
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

  const fields: Array<[string, string, (v: string) => void]> = [
    ["Weight (kg)", weight, setWeight],
    ["SMM (kg)", smm, setSmm],
    ["Body fat %", bfPct, setBfPct],
    ["BF mass (kg)", bfMass, setBfMass],
  ];

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
        <h2 className="font-semibold text-text-primary text-sm">Edit scan</h2>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Scan date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {fields.map(([label, val, set]) => (
            <label key={label} className="block">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">{label}</span>
              <input
                type="number"
                step="any"
                value={val}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-bg-main"
              />
            </label>
          ))}
        </div>

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
