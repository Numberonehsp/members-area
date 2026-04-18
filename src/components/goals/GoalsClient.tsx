"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalType = "strength" | "body" | "habit" | "education";
type GoalStatus = "active" | "completed";

type Goal = {
  id: string;
  type: GoalType;
  title: string;
  targetValue: number;
  unit: string;
  currentValue: number;
  startValue: number;
  deadline: string;
  status: GoalStatus;
  note: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_GOALS: Goal[] = [
  {
    id: "g1",
    type: "strength",
    title: "Deadlift 180kg",
    targetValue: 180,
    unit: "kg",
    currentValue: 160,
    startValue: 160,
    deadline: "2026-07-01",
    status: "active",
    note: "Hit 160 in April testing — 20kg to go.",
  },
  {
    id: "g2",
    type: "body",
    title: "Reach 15% body fat",
    targetValue: 15,
    unit: "%",
    currentValue: 18.6,
    startValue: 18.6,
    deadline: "2026-09-01",
    status: "active",
    note: "",
  },
  {
    id: "g3",
    type: "habit",
    title: "Train 12x this month",
    targetValue: 12,
    unit: "sessions",
    currentValue: 9,
    startValue: 0,
    deadline: "2026-04-30",
    status: "active",
    note: "",
  },
  {
    id: "g4",
    type: "education",
    title: "Complete Movement Fundamentals",
    targetValue: 6,
    unit: "modules",
    currentValue: 0,
    startValue: 0,
    deadline: "2026-06-01",
    status: "active",
    note: "",
  },
  {
    id: "g5",
    type: "strength",
    title: "Back Squat 130kg",
    targetValue: 130,
    unit: "kg",
    currentValue: 120,
    startValue: 100,
    deadline: "2026-07-01",
    status: "completed",
    note: "Actually hit 120 in April — updating target.",
  },
];

// ─── Type config ──────────────────────────────────────────────────────────────

type TypeConfig = {
  label: string;
  emoji: string;
  accentClass: string;
  progressClass: string;
  badgeBg: string;
  badgeText: string;
};

const TYPE_CONFIG: Record<GoalType, TypeConfig> = {
  strength: {
    label: "Strength",
    emoji: "💪",
    accentClass: "from-brand to-transparent",
    progressClass: "bg-brand",
    badgeBg: "bg-brand/10",
    badgeText: "text-brand",
  },
  body: {
    label: "Body",
    emoji: "⚖️",
    accentClass: "from-status-amber to-transparent",
    progressClass: "bg-status-amber",
    badgeBg: "bg-status-amber/10",
    badgeText: "text-status-amber",
  },
  habit: {
    label: "Habit",
    emoji: "🔥",
    accentClass: "from-status-green to-transparent",
    progressClass: "bg-status-green",
    badgeBg: "bg-status-green/10",
    badgeText: "text-status-green",
  },
  education: {
    label: "Education",
    emoji: "📚",
    accentClass: "",
    progressClass: "",
    badgeBg: "bg-[#7c6fcd]/10",
    badgeText: "text-[#7c6fcd]",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function progressPct(current: number, target: number, start: number): number {
  if (target === start) return 100;
  if (target > start) {
    // Increase goal (e.g. deadlift heavier)
    return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)));
  } else {
    // Decrease goal (e.g. lower body fat)
    return Math.max(0, Math.min(100, Math.round(((start - current) / (start - target)) * 100)));
  }
}

function generateId(): string {
  return `g${Date.now()}`;
}

// ─── Blank form state ─────────────────────────────────────────────────────────

type FormState = {
  title: string;
  type: GoalType;
  currentValue: string;
  targetValue: string;
  unit: string;
  deadline: string;
  note: string;
};

const BLANK_FORM: FormState = {
  title: "",
  type: "strength",
  currentValue: "",
  targetValue: "",
  unit: "",
  deadline: "",
  note: "",
};

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onMarkComplete,
  onEdit,
}: {
  goal: Goal;
  onMarkComplete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  const cfg = TYPE_CONFIG[goal.type];
  const pct = progressPct(goal.currentValue, goal.targetValue, goal.startValue);
  const days = daysLeft(goal.deadline);
  const isOverdue = days < 0;
  const isEducation = goal.type === "education";
  const lowerIsBetter = goal.targetValue < goal.startValue;

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl relative overflow-hidden shadow-sm flex flex-col">
      {isEducation ? (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: "linear-gradient(to right, #7c6fcd, transparent)" }}
        />
      ) : (
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentClass}`} />
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-border-light text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onMarkComplete(goal.id)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-status-green/30 text-status-green hover:bg-status-green/10 transition-colors"
              title="Mark complete"
            >
              ✓
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-text-primary text-sm leading-snug">{goal.title}</h3>

        <div>
          <div className="h-2 bg-border-light rounded-full overflow-hidden mb-1.5">
            {isEducation ? (
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: "#7c6fcd" }}
              />
            ) : (
              <div
                className={`h-full rounded-full transition-all ${cfg.progressClass}`}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-data text-xs text-text-primary font-semibold">
              {goal.currentValue} / {goal.targetValue}{" "}
              <span className="text-text-secondary font-normal">{goal.unit}</span>
            </span>
            <div className="flex items-center gap-2">
              {lowerIsBetter && (
                <span className="text-[10px] text-text-secondary">↓ lower is better</span>
              )}
              <span className="text-xs text-text-secondary font-medium">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{formatDeadline(goal.deadline)}</span>
          {isOverdue ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-red/10 text-status-red border border-status-red/20 font-semibold">
              Overdue
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-light text-text-secondary font-medium">
              {days}d left
            </span>
          )}
        </div>

        {goal.note && (
          <p className="text-xs text-text-secondary italic leading-relaxed">{goal.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── Completed card (compact) ─────────────────────────────────────────────────

function CompletedGoalCard({ goal }: { goal: Goal }) {
  const cfg = TYPE_CONFIG[goal.type];
  const pct = progressPct(goal.currentValue, goal.targetValue, goal.startValue);

  return (
    <div className="bg-bg-card border border-border-light rounded-xl relative overflow-hidden opacity-60 flex items-center gap-4 px-4 py-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-status-green/10 border border-status-green/20 flex items-center justify-center text-status-green text-sm font-bold">
        ✓
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
            {cfg.emoji}
          </span>
          <span className="text-sm font-semibold text-text-primary truncate">{goal.title}</span>
        </div>
        <span className="font-data text-xs text-text-secondary">
          {goal.currentValue} / {goal.targetValue} {goal.unit} · {pct}%
        </span>
      </div>
      <span className="text-[10px] text-text-secondary shrink-0">{formatDeadline(goal.deadline)}</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const GOAL_TYPES: { value: GoalType; label: string; emoji: string }[] = [
  { value: "strength", label: "Strength", emoji: "💪" },
  { value: "body", label: "Body", emoji: "⚖️" },
  { value: "habit", label: "Habit", emoji: "🔥" },
  { value: "education", label: "Education", emoji: "📚" },
];

function GoalModal({
  editingGoal,
  onSave,
  onClose,
}: {
  editingGoal: Goal | null;
  onSave: (form: FormState, editingId: string | null) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    editingGoal
      ? {
          title: editingGoal.title,
          type: editingGoal.type,
          currentValue: String(editingGoal.currentValue),
          targetValue: String(editingGoal.targetValue),
          unit: editingGoal.unit,
          deadline: editingGoal.deadline,
          note: editingGoal.note,
        }
      : BLANK_FORM
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form, editingGoal?.id ?? null);
  }

  function field(label: string, children: React.ReactNode) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
        {children}
      </div>
    );
  }

  const inputClass =
    "bg-bg-main border border-border-light rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand/50 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-light rounded-2xl w-full max-w-md shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-0.5">
            {editingGoal ? "Edit Goal" : "New Goal"}
          </p>
          <h2 className="font-display text-xl text-text-primary">
            {editingGoal ? editingGoal.title : "Set a new target"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {field(
            "Title",
            <input
              required
              type="text"
              className={inputClass}
              placeholder="e.g. Deadlift 180kg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          )}

          {field(
            "Type",
            <div className="flex gap-2 flex-wrap">
              {GOAL_TYPES.map((t) => {
                const selected = form.type === t.value;
                const cfg = TYPE_CONFIG[t.value];
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                      selected
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-current`
                        : "bg-bg-main border-border-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {field(
              "Current",
              <input
                required
                type="number"
                step="any"
                className={inputClass}
                placeholder="0"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              />
            )}
            {field(
              "Target",
              <input
                required
                type="number"
                step="any"
                className={inputClass}
                placeholder="100"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
              />
            )}
            {field(
              "Unit",
              <input
                required
                type="text"
                className={inputClass}
                placeholder="kg"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            )}
          </div>

          {field(
            "Deadline",
            <input
              required
              type="date"
              className={inputClass}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          )}

          {field(
            "Note (optional)",
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Any context or motivation…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          )}

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
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors"
            >
              {editingGoal ? "Save changes" : "Add goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>(SEED_GOALS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const closestDeadline = activeGoals
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    ?.deadline;

  function openAddModal() { setEditingGoal(null); setModalOpen(true); }
  function openEditModal(goal: Goal) { setEditingGoal(goal); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingGoal(null); }

  function handleMarkComplete(id: string) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "completed" } : g)));
  }

  function handleSave(form: FormState, editingId: string | null) {
    if (editingId) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingId
            ? {
                ...g,
                title: form.title,
                type: form.type,
                currentValue: parseFloat(form.currentValue) || 0,
                targetValue: parseFloat(form.targetValue) || 0,
                unit: form.unit,
                deadline: form.deadline,
                note: form.note,
              }
            : g
        )
      );
    } else {
      const currentVal = parseFloat(form.currentValue) || 0;
      const newGoal: Goal = {
        id: generateId(),
        type: form.type,
        title: form.title,
        currentValue: currentVal,
        startValue: currentVal,  // locked at creation time
        targetValue: parseFloat(form.targetValue) || 0,
        unit: form.unit,
        deadline: form.deadline,
        status: "active",
        note: form.note,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
    closeModal();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">
            My Goals
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">
            Goals
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Set targets, track progress, celebrate wins.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="mt-1 shrink-0 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Add Goal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active goals", value: activeGoals.length, colour: "text-text-primary" },
          { label: "Completed", value: completedGoals.length, colour: "text-status-green" },
          {
            label: "Closest deadline",
            value: closestDeadline ? formatDeadline(closestDeadline) : "—",
            colour: "text-status-amber",
            small: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className={`font-display leading-none mb-1 ${s.colour} ${s.small ? "text-lg mt-1" : "text-3xl"}`}>
              {s.value}
            </p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {activeGoals.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold">
              Active — {activeGoals.length}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onMarkComplete={handleMarkComplete} onEdit={openEditModal} />
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-semibold text-text-primary mb-1">No active goals</p>
          <p className="text-sm text-text-secondary mb-4">
            Add your first goal to start tracking progress.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Add Goal
          </button>
        </div>
      )}

      {completedGoals.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <span className={`transition-transform ${completedOpen ? "rotate-90" : ""}`}>▶</span>
            <span>Completed — {completedGoals.length}</span>
          </button>

          {completedOpen && (
            <div className="space-y-2">
              {completedGoals.map((goal) => (
                <CompletedGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <GoalModal editingGoal={editingGoal} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
}
