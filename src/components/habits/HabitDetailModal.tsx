"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { METRIC_CONFIG, type Habit } from "@/types/habits";
import {
  currentPeriodValue,
  progressPct,
  formatMetricValue,
  todayISO,
  formatDate,
  type HabitLogEntry,
} from "@/lib/habit-logic";

// Discrete daily actions read better as bars; continuous measures as a line.
const BAR_METRICS = new Set(["steps", "workouts", "exercise_reps", "distance"]);

const inputClass =
  "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

export default function HabitDetailModal({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const config = METRIC_CONFIG[habit.metric];
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backfillDate, setBackfillDate] = useState(todayISO());
  const [backfillValue, setBackfillValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/habits/${habit.id}/logs`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load logs");
      setLogs((json.logs ?? []).map((l: { date: string; value: number }) => ({ date: l.date, value: l.value })));
    } catch (err) {
      console.error("Failed to load habit logs:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id]);

  async function handleBackfill(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(backfillValue);
    if (!isFinite(value)) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/habits/${habit.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: backfillDate, value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save value");
      setBackfillValue("");
      await load();
    } catch (err) {
      console.error("Failed to save backfilled value:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save value");
    } finally {
      setSaving(false);
    }
  }

  const current = currentPeriodValue(logs, habit.cadence, habit.aggregation, todayISO());
  const pct = progressPct(current, habit.target);
  const chartData = useMemo(() => logs.map((l) => ({ date: formatDate(l.date), value: l.value })), [logs]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-2xl shadow-xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-green to-transparent" />

        <div className="px-6 pt-6 pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-status-green font-semibold mb-0.5">
            {config.emoji} {config.label}
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                {current != null ? formatMetricValue(current, config.inputKind, config.unit) : "No data yet"}
              </h2>
              {habit.target != null && (
                <p className="text-sm text-text-secondary">
                  of {formatMetricValue(habit.target, config.inputKind, config.unit)} target
                  {pct != null && ` · ${pct}%`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {loadError && (
            <p className="text-sm text-status-red bg-status-red/10 border border-status-red/30 rounded-xl px-3 py-2">
              {loadError}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-text-secondary">No values logged yet.</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                {BAR_METRICS.has(habit.metric) ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {habit.status === "active" && (
            <form onSubmit={handleBackfill} className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={backfillDate}
                  max={habit.end_date && habit.end_date < todayISO() ? habit.end_date : todayISO()}
                  min={habit.start_date}
                  onChange={(e) => setBackfillDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Value ({config.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={backfillValue}
                  onChange={(e) => setBackfillValue(e.target.value)}
                  className={`${inputClass} w-28`}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                Save
              </button>
              {saveError && <p className="text-xs text-status-red self-center">{saveError}</p>}
            </form>
          )}

          {habit.status !== "active" && (
            <p className="text-xs text-text-secondary italic">
              This habit has ended — its history is kept, but new values can no longer be logged.
            </p>
          )}

          {logs.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary text-xs uppercase tracking-wide">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .slice()
                  .reverse()
                  .map((l) => (
                    <tr key={l.date} className="border-t border-border-light">
                      <td className="py-1.5 text-text-secondary">{formatDate(l.date)}</td>
                      <td className="py-1.5 text-text-primary font-data">
                        {formatMetricValue(l.value, config.inputKind, config.unit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
