"use client";

import { useState, useEffect } from "react";
import type { InBodyScan } from "@/lib/staffhub";
import EditScanModal from "@/components/coach/EditScanModal";

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
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillMsg(null);
    const res = await fetch("/api/coach/backfill-names", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBackfilling(false);
    if (res.ok) {
      setBackfillMsg(`Done — updated ${data.scans_updated} scan${data.scans_updated !== 1 ? "s" : ""} and ${data.strength_updated} strength result${data.strength_updated !== 1 ? "s" : ""}. Reload to see changes.`);
      loadRecentScans();
    } else {
      setBackfillMsg(data.error ?? "Backfill failed");
    }
  }
  const [recentScans, setRecentScans] = useState<InBodyScan[]>([]);
  const [editing, setEditing] = useState<InBodyScan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/inbody", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setRecentScans((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

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
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-text-primary text-sm">Recent Scans</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {backfillMsg && (
                <span className="text-xs text-text-secondary">{backfillMsg}</span>
              )}
              <button
                onClick={handleBackfill}
                disabled={backfilling}
                title="Fix missing member names on old records by looking them up from GymMaster"
                className="text-xs text-text-secondary border border-border-light px-3 py-1.5 rounded-lg hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-50"
              >
                {backfilling ? "Fixing names…" : "Fix missing names"}
              </button>
            </div>
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
                    <th className="px-4 py-3" />
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setEditing(scan)}
                          className="text-text-muted hover:text-brand transition-colors mr-2"
                          title="Edit scan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(scan.id)}
                          disabled={deletingId === scan.id}
                          className="text-text-muted hover:text-status-red transition-colors disabled:opacity-40"
                          title="Delete scan"
                        >
                          {deletingId === scan.id ? (
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

      {editing && (
        <EditScanModal
          scan={{
            id: editing.id,
            scan_date: editing.scan_date,
            weight: editing.weight,
            smm: editing.smm,
            bf_pct: editing.bf_pct,
            bf_mass: editing.bf_mass,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSaved={loadRecentScans}
        />
      )}
    </div>
  );
}
