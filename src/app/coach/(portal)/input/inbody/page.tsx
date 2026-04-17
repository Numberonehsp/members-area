"use client";

import { useState } from "react";

const SAMPLE_MEMBERS = [
  "Alex Johnson",
  "Sam Davies",
  "Jordan Williams",
  "Casey Roberts",
  "Morgan Evans",
  "Priya Sharma",
  "Tom Hughes",
];

const RECENT_SCANS = [
  { member: "Alex Johnson", date: "2026-04-03", weight: 82.4, smm: 38.1, bfPct: 18.2, bfMass: 15.0 },
  { member: "Alex Johnson", date: "2026-03-01", weight: 83.8, smm: 37.6, bfPct: 19.5, bfMass: 16.3 },
  { member: "Priya Sharma", date: "2026-04-03", weight: 61.2, smm: 24.8, bfPct: 22.1, bfMass: 13.5 },
  { member: "Morgan Evans", date: "2026-04-03", weight: 75.0, smm: 35.2, bfPct: 15.8, bfMass: 11.9 },
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachInBodyInputPage() {
  const [member, setMember] = useState("");
  const [scanDate, setScanDate] = useState(todayString());
  const [weight, setWeight] = useState("");
  const [smm, setSmm] = useState("");
  const [bfPct, setBfPct] = useState("");
  const [bfMass, setBfMass] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(true);
    setMember("");
    setScanDate(todayString());
    setWeight("");
    setSmm("");
    setBfPct("");
    setBfMass("");
    setNotes("");
    setTimeout(() => setSuccess(false), 4000);
  }

  const inputClass =
    "w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data";

  const labelClass = "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5";

  return (
    <div>
      {/* Page header */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Input Data
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        InBody Scan
      </h1>

      {/* Success banner */}
      {success && (
        <div className="mb-6 flex items-center gap-3 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-medium px-4 py-3 rounded-xl">
          <span className="text-base">✓</span>
          <span>Scan saved! Ready to wire to Supabase.</span>
        </div>
      )}

      {/* Form card */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="absolute-accent-placeholder" />
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Member + Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Member</label>
                <select
                  required
                  value={member}
                  onChange={(e) => setMember(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a member…</option>
                  {SAMPLE_MEMBERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Scan Date</label>
                <input
                  type="date"
                  required
                  value={scanDate}
                  onChange={(e) => setScanDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Metrics 2x2 grid */}
            <div>
              <p className={labelClass}>Metrics</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 82.4"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Skeletal Muscle Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 38.1"
                    value={smm}
                    onChange={(e) => setSmm(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 18.2"
                    value={bfPct}
                    onChange={(e) => setBfPct(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Body Fat Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 15.0"
                    value={bfMass}
                    onChange={(e) => setBfMass(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes <span className="normal-case font-normal text-text-secondary">(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Any observations or context…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Save Scan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent scans table */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Recent Scans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-bg-main/50">
                  {["Member", "Date", "Weight", "SMM", "BF%", "BF Mass"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {RECENT_SCANS.map((scan, i) => (
                  <tr key={i} className="hover:bg-bg-main/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{scan.member}</td>
                    <td className="px-4 py-3 font-data text-text-secondary text-xs">{scan.date}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.weight} kg</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.smm} kg</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bfPct}%</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bfMass} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
