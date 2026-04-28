"use client";

import { useState, useEffect } from "react";
import type { InBodyScan } from "@/lib/staffhub";

type Member = { id: string; name: string };

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function CoachInBodyInputPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [recentScans, setRecentScans] = useState<InBodyScan[]>([]);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [scanDate, setScanDate] = useState(todayString());
  const [weight, setWeight] = useState("");
  const [smm, setSmm] = useState("");
  const [bfPct, setBfPct] = useState("");
  const [bfMass, setBfMass] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecentScans() {
    const res = await fetch("/api/inbody");
    if (res.ok) {
      const data = await res.json();
      setRecentScans(data.scans ?? []);
    }
  }

  useEffect(() => {
    fetch("/api/gymmaster/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));

    loadRecentScans();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const member = members.find((m) => m.id === selectedMemberId);

    const res = await fetch("/api/inbody", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymmaster_member_id: selectedMemberId,
        member_name: member?.name ?? null,
        scan_date: scanDate,
        weight: weight ? parseFloat(weight) : null,
        smm: smm ? parseFloat(smm) : null,
        bf_pct: bfPct ? parseFloat(bfPct) : null,
        bf_mass: bfMass ? parseFloat(bfMass) : null,
        notes: notes || null,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      setSelectedMemberId("");
      setScanDate(todayString());
      setWeight(""); setSmm(""); setBfPct(""); setBfMass(""); setNotes("");
      setTimeout(() => setSuccess(false), 4000);
      loadRecentScans();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save scan");
    }
  }

  const inputClass =
    "w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data";
  const labelClass = "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5";

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Input Data
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        InBody Scan
      </h1>

      {success && (
        <div className="mb-6 flex items-center gap-3 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-medium px-4 py-3 rounded-xl">
          <span className="text-base">✓</span>
          <span>Scan saved successfully.</span>
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
          <span className="text-base">✕</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Member</label>
                {membersLoading ? (
                  <div className={inputClass + " text-text-secondary"}>Loading members…</div>
                ) : (
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a member…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
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

            <div>
              <p className={labelClass}>Metrics</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Weight (kg)", value: weight, set: setWeight, placeholder: "e.g. 82.4" },
                  { label: "Skeletal Muscle Mass (kg)", value: smm, set: setSmm, placeholder: "e.g. 38.1" },
                  { label: "Body Fat %", value: bfPct, set: setBfPct, placeholder: "e.g. 18.2" },
                  { label: "Body Fat Mass (kg)", value: bfMass, set: setBfMass, placeholder: "e.g. 15.0" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs text-text-secondary mb-1">{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Notes <span className="normal-case font-normal text-text-secondary">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Any observations or context…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || membersLoading}
                className="bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? "Saving…" : "Save Scan"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Recent Scans</h2>
          </div>
          {recentScans.length === 0 ? (
            <p className="px-5 py-8 text-sm text-text-secondary text-center">No scans recorded yet.</p>
          ) : (
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
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-bg-main/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {scan.member_name ?? <span className="text-text-secondary text-xs">ID {scan.gymmaster_member_id}</span>}
                      </td>
                      <td className="px-4 py-3 font-data text-text-secondary text-xs">{formatDate(scan.scan_date)}</td>
                      <td className="px-4 py-3 font-data text-text-primary">{scan.weight != null ? `${scan.weight} kg` : "—"}</td>
                      <td className="px-4 py-3 font-data text-text-primary">{scan.smm != null ? `${scan.smm} kg` : "—"}</td>
                      <td className="px-4 py-3 font-data text-text-primary">{scan.bf_pct != null ? `${scan.bf_pct}%` : "—"}</td>
                      <td className="px-4 py-3 font-data text-text-primary">{scan.bf_mass != null ? `${scan.bf_mass} kg` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
