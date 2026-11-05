"use client";

import { useEffect, useState } from "react";

type CoachGoal = { kind: "goal" | "next"; goal_text: string; set_on: string; set_by: string };

const LABEL: Record<CoachGoal["kind"], string> = {
  goal: "Current goals",
  next: "Next goal",
};

function formatSetOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
}

// Goals your coach wrote down with you at a check-in. Read-only: the coach
// updates them at the next check-in. Shows nothing until there is one.
export default function CoachGoals() {
  const [goals, setGoals] = useState<CoachGoal[]>([]);

  useEffect(() => {
    fetch("/api/goals/coach")
      .then((r) => (r.ok ? r.json() : { goals: [] }))
      .then((json) => setGoals(json.goals ?? []))
      .catch(() => setGoals([]));
  }, []);

  const ordered = (["goal", "next"] as const)
    .map((k) => goals.find((g) => g.kind === k))
    .filter((g): g is CoachGoal => Boolean(g));
  if (ordered.length === 0) return null;

  return (
    <section aria-label="Goals from your coach">
      <p className="text-[10px] tracking-[0.2em] uppercase text-brand font-semibold mb-3">From your coach</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordered.map((g) => (
          <div key={g.kind} className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-text-secondary mb-1">{LABEL[g.kind]}</p>
            <p className="text-text-primary whitespace-pre-line">{g.goal_text}</p>
            <p className="text-xs text-text-secondary mt-3">
              Set with {g.set_by} on {formatSetOn(g.set_on)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
