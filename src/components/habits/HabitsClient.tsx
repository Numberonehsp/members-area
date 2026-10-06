"use client";

import { useState, useEffect } from "react";
import {
  METRIC_CONFIG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  metricsInCategory,
  NUTRITION_METRICS,
  MAX_ACTIVE_HABITS,
  type Habit,
  type HabitCategory,
  type HabitMetric,
  type HabitCadence,
  type HabitAggregation,
} from "@/types/habits";
import {
  hoursMinutesToMinutes,
  formatMetricValue,
  todayISO,
  formatDate,
} from "@/lib/habit-logic";
import HabitDetailModal from "./HabitDetailModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

// ─── Quick-entry input (handles sleep's h/m pair vs a plain number) ──────────

function QuickEntryInput({
  habit,
  onSubmit,
}: {
  habit: Habit;
  onSubmit: (value: number) => void;
}) {
  const config = METRIC_CONFIG[habit.metric];
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (config.inputKind === "hours_minutes") {
      const h = parseInt(hours, 10) || 0;
      const m = parseInt(minutes, 10) || 0;
      onSubmit(hoursMinutesToMinutes(h, m));
      setHours("");
      setMinutes("");
    } else {
      const v = parseFloat(value);
      if (!isFinite(v)) return;
      onSubmit(v);
      setValue("");
    }
  }

  if (config.inputKind === "hours_minutes") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          placeholder="h"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className={`${inputClass} w-14 text-center`}
        />
        <input
          type="number"
          min="0"
          max="59"
          placeholder="m"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className={`${inputClass} w-14 text-center`}
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          Log
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="number"
        step="any"
        min="0"
        placeholder={config.unit}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} w-24`}
      />
      <button
        type="submit"
        className="bg-brand hover:bg-brand-dark text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
      >
        Log
      </button>
    </form>
  );
}

// ─── Habit card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  onLog,
  onOpenDetail,
  onArchive,
  justLogged,
}: {
  habit: Habit;
  onLog: (habitId: string, value: number) => void;
  onOpenDetail: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  justLogged: boolean;
}) {
  const config = METRIC_CONFIG[habit.metric];
  const cadenceLabel =
    habit.cadence === "daily"
      ? "Daily"
      : `Weekly ${habit.aggregation === "average" ? "average" : "total"}`;

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl relative overflow-hidden shadow-sm flex flex-col p-5 gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide bg-status-green/10 text-status-green">
          {config.emoji} {CATEGORY_LABELS[habit.category]}
        </span>
        <button
          type="button"
          onClick={() => onArchive(habit.id)}
          className="text-[11px] px-2.5 py-1 rounded-lg border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
        >
          End
        </button>
      </div>

      <h3 className="font-semibold text-text-primary text-sm leading-snug">{config.label}</h3>
      <p className="text-xs text-text-secondary">
        {cadenceLabel}
        {habit.target != null && ` · target ${formatMetricValue(habit.target, config.inputKind, config.unit)}`}
      </p>

      <div className="flex items-center gap-2">
        <QuickEntryInput habit={habit} onSubmit={(v) => onLog(habit.id, v)} />
        {justLogged && <span className="text-xs text-status-green font-semibold">Logged ✓</span>}
      </div>
      {NUTRITION_METRICS.has(habit.metric) && (
        <p className="text-[11px] text-text-secondary italic">
          Shared with your Nutrition page — logging here updates the same day&apos;s totals.
        </p>
      )}

      <button
        type="button"
        onClick={() => onOpenDetail(habit)}
        className="text-xs text-brand hover:text-brand-dark font-semibold text-left mt-1"
      >
        View progress ▸
      </button>
    </div>
  );
}

// ─── Archived card (compact) ──────────────────────────────────────────────────

function ArchivedHabitCard({ habit, onOpenDetail }: { habit: Habit; onOpenDetail: (habit: Habit) => void }) {
  const config = METRIC_CONFIG[habit.metric];
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(habit)}
      className="w-full text-left bg-bg-card border border-border-light rounded-xl relative overflow-hidden opacity-60 hover:opacity-90 transition-opacity flex items-center gap-4 px-4 py-3"
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-border-light flex items-center justify-center text-sm">
        {config.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-text-primary truncate">{config.label}</span>
        <p className="text-xs text-text-secondary">
          {formatDate(habit.start_date)} – {habit.end_date ? formatDate(habit.end_date) : "ongoing"}
        </p>
      </div>
    </button>
  );
}

// ─── Setup modal ────────────────────────────────────────────────────────────

function SetupModal({
  activeCount,
  activeMetrics,
  onSave,
  onClose,
}: {
  activeCount: number;
  activeMetrics: Set<HabitMetric>;
  onSave: (fields: {
    metric: HabitMetric;
    target: string;
    cadence: HabitCadence;
    aggregation: HabitAggregation;
    start_date: string;
    end_date: string;
  }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<HabitCategory>("wellbeing");
  const [metric, setMetric] = useState<HabitMetric | null>(null);
  const [target, setTarget] = useState("");
  const [targetHours, setTargetHours] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("");
  const [cadence, setCadence] = useState<HabitCadence>("daily");
  const [aggregation, setAggregation] = useState<HabitAggregation>("total");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const atCap = activeCount >= MAX_ACTIVE_HABITS;
  const selectedConfig = metric ? METRIC_CONFIG[metric] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!metric) return;
    setSaving(true);
    setError(null);

    const config = METRIC_CONFIG[metric];
    const targetValue =
      config.inputKind === "hours_minutes"
        ? targetHours || targetMinutes
          ? String(hoursMinutesToMinutes(parseInt(targetHours, 10) || 0, parseInt(targetMinutes, 10) || 0))
          : ""
        : target;

    const err = await onSave({
      metric,
      target: targetValue,
      cadence,
      aggregation,
      start_date: startDate,
      end_date: endDate,
    });

    setSaving(false);
    if (err) {
      setError(err);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">New Habit</p>
          <h2 className="font-display text-xl text-text-primary">Track something new</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {atCap ? (
            <p className="text-sm text-status-amber">
              You already have {MAX_ACTIVE_HABITS} active habits — end one before adding another.
            </p>
          ) : !metric ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_ORDER.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      category === c
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {metricsInCategory(category).map((m) => {
                  const disabled = activeMetrics.has(m.metric);
                  return (
                    <button
                      key={m.metric}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMetric(m.metric)}
                      className={`text-center p-3 rounded-xl border transition-colors ${
                        disabled
                          ? "opacity-40 cursor-not-allowed border-border-light"
                          : "border-border-light hover:border-brand/40"
                      }`}
                    >
                      <div className="text-xl mb-1">{m.emoji}</div>
                      <div className="text-xs font-semibold text-text-primary">{m.label}</div>
                      <div className="text-[10px] text-text-secondary">{m.unit}</div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-text-primary font-semibold">
                {selectedConfig!.emoji} {selectedConfig!.label}
                <button
                  type="button"
                  onClick={() => setMetric(null)}
                  className="ml-2 text-xs text-brand hover:text-brand-dark font-normal"
                >
                  change
                </button>
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Target (optional)
                </label>
                {selectedConfig!.inputKind === "hours_minutes" ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="hours"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      className={`${inputClass} w-20`}
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="minutes"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(e.target.value)}
                      className={`${inputClass} w-24`}
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder={`e.g. 10000 ${selectedConfig!.unit}`}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Evaluate as
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCadence("daily")}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "daily"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCadence("weekly");
                      setAggregation("total");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "weekly" && aggregation === "total"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Weekly total
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCadence("weekly");
                      setAggregation("average");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      cadence === "weekly" && aggregation === "average"
                        ? "bg-status-green/10 text-status-green border-current"
                        : "bg-bg-main border-border-light text-text-secondary"
                    }`}
                  >
                    Weekly average
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Start date
                  </label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    End date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-status-red">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-sm font-semibold text-white transition-colors"
                >
                  {saving ? "Saving…" : "Add habit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HabitsClient() {
  const [active, setActive] = useState<Habit[]>([]);
  const [archived, setArchived] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/habits");
      const json = await res.json();
      setActive(json.active ?? []);
      setArchived(json.archived ?? []);
    } catch (err) {
      console.error("Failed to load habits:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLog(habitId: string, value: number) {
    setActionError(null);
    try {
      const res = await fetch(`/api/habits/${habitId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayISO(), value }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to log value");
      }
      setJustLoggedId(habitId);
      setTimeout(() => setJustLoggedId(null), 2000);
    } catch (err) {
      console.error("Failed to log habit value:", err);
      setActionError(err instanceof Error ? err.message : "Failed to log value");
    }
  }

  // No optimistic removal here — archive, then reload from the server, so a
  // failed request never leaves a habit looking gone when it wasn't.
  async function handleArchive(habitId: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to end habit");
      }
      await load();
    } catch (err) {
      console.error("Failed to archive habit:", err);
      setActionError(err instanceof Error ? err.message : "Failed to end habit");
    }
  }

  async function handleSave(fields: {
    metric: HabitMetric;
    target: string;
    cadence: HabitCadence;
    aggregation: HabitAggregation;
    start_date: string;
    end_date: string;
  }): Promise<string | null> {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: fields.metric,
          target: fields.target === "" ? null : Number(fields.target),
          cadence: fields.cadence,
          aggregation: fields.cadence === "weekly" ? fields.aggregation : null,
          start_date: fields.start_date,
          end_date: fields.end_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Something went wrong";
      await load();
      setModalOpen(false);
      return null;
    } catch (err) {
      console.error("Failed to save habit:", err);
      return "Something went wrong";
    }
  }

  const activeMetrics = new Set(active.map((h) => h.metric));

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">Loading habits…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">My Habits</p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">Habits</h1>
          <p className="text-sm text-text-secondary mt-2">
            Up to {MAX_ACTIVE_HABITS} at a time — log daily, see your trend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-1 shrink-0 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Add Habit
        </button>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-status-red/10 border border-status-red/30 rounded-xl px-4 py-2.5">
          <p className="text-sm text-status-red">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-status-red hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {active.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onLog={handleLog}
              onOpenDetail={setDetailHabit}
              onArchive={handleArchive}
              justLogged={justLoggedId === habit.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🔥</p>
          <p className="font-semibold text-text-primary mb-1">No active habits</p>
          <p className="text-sm text-text-secondary mb-4">Pick up to {MAX_ACTIVE_HABITS} things to track.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Add Habit
          </button>
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setArchivedOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <span className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}>▶</span>
            <span>Archived — {archived.length}</span>
          </button>
          {archivedOpen && (
            <div className="space-y-2">
              {archived.map((habit) => (
                <ArchivedHabitCard key={habit.id} habit={habit} onOpenDetail={setDetailHabit} />
              ))}
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <SetupModal
          activeCount={active.length}
          activeMetrics={activeMetrics}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {detailHabit && <HabitDetailModal habit={detailHabit} onClose={() => setDetailHabit(null)} />}
    </div>
  );
}
