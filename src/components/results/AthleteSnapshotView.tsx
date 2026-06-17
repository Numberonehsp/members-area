import Link from "next/link";
import type { InBodyScan, StrengthResult, MemberEvent } from "@/lib/staffhub";

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShort(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function DeltaBadge({ current, baseline, unit, downIsGood = false, label }: {
  current: number; baseline: number; unit: string; downIsGood?: boolean; label?: string;
}) {
  const diff = round1(current - baseline);
  if (diff === 0) return null;
  const isGood = downIsGood ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      isGood
        ? "bg-green-500/10 text-green-500"
        : "bg-red-500/10 text-red-500"
    }`}>
      {isGood ? "↑" : "↓"} {sign}{diff}{unit}
      {label && <span className="font-normal opacity-70">{label}</span>}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-4">
      {children}
    </h2>
  );
}

type Props = {
  scans: InBodyScan[];
  strengthResults: StrengthResult[];
  events: MemberEvent[];
  goalsHref?: string;
  isCoach?: boolean;
}

export default function AthleteSnapshotView({ scans, strengthResults, events, goalsHref, isCoach }: Props) {
  const chronoScans = [...scans].reverse();
  const firstScan = chronoScans.at(0) ?? null;
  const prevScan = chronoScans.length >= 3 ? chronoScans.at(-2)! : null;
  const currentScan = chronoScans.at(-1) ?? null;
  const hasMultipleScans = chronoScans.length > 1;

  const exerciseMap = new Map<string, StrengthResult[]>();
  for (const r of strengthResults) {
    const arr = exerciseMap.get(r.exercise) ?? [];
    arr.push(r);
    exerciseMap.set(r.exercise, arr);
  }

  type ExerciseSummary = {
    exercise: string;
    firstResult: StrengthResult;
    prevResult: StrengthResult | null;
    currentResult: StrengthResult;
    pbValue: number;
    isPBCurrent: boolean;
    hasHistory: boolean;
  }

  const exercises: ExerciseSummary[] = Array.from(exerciseMap.entries())
    .map(([exercise, results]) => {
      const chrono = [...results].sort((a, b) => a.tested_date.localeCompare(b.tested_date));
      const firstR = chrono[0];
      const currentR = chrono.at(-1)!;
      const prevR = chrono.length >= 3 ? chrono.at(-2)! : null;
      const pbValue = Math.max(...results.map((r) => r.result_value));
      return {
        exercise,
        firstResult: firstR,
        prevResult: prevR,
        currentResult: currentR,
        pbValue,
        isPBCurrent: currentR.result_value === pbValue,
        hasHistory: firstR.id !== currentR.id,
      };
    })
    .sort((a, b) => a.exercise.localeCompare(b.exercise));

  const bodyMetrics = currentScan ? [
    { key: "weight", label: "Weight", unit: " kg", downIsGood: true,
      value: currentScan.weight, first: firstScan?.weight, prev: prevScan?.weight },
    { key: "smm", label: "Muscle Mass", unit: " kg", downIsGood: false,
      value: currentScan.smm, first: firstScan?.smm, prev: prevScan?.smm },
    { key: "bf_pct", label: "Body Fat", unit: "%", downIsGood: true,
      value: currentScan.bf_pct, first: firstScan?.bf_pct, prev: prevScan?.bf_pct },
    { key: "bf_mass", label: "Fat Mass", unit: " kg", downIsGood: true,
      value: currentScan.bf_mass, first: firstScan?.bf_mass, prev: prevScan?.bf_mass },
  ].filter((m) => m.value != null) : [];

  return (
    <div className="space-y-10">

      {/* ── Body Composition ──────────────────────────────────────── */}
      <section>
        <SectionHeading>Body Composition</SectionHeading>

        {!currentScan ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">⚖️</p>
            <p className="text-text-primary font-semibold text-sm mb-1">No scans yet</p>
            <p className="text-text-secondary text-xs">Speak to a coach to book your first InBody scan.</p>
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className={`grid gap-3 ${bodyMetrics.length >= 4 ? "grid-cols-2 md:grid-cols-4" : `grid-cols-${bodyMetrics.length}`}`}>
              {bodyMetrics.map((m) => (
                <div key={m.key} className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
                  <p className="text-[11px] text-text-secondary mb-2">{m.label}</p>
                  <p className="text-3xl font-bold text-text-primary leading-none tracking-tight">
                    {round1(m.value!)}<span className="text-base font-normal text-text-secondary ml-0.5">{m.unit.trim()}</span>
                  </p>
                  {hasMultipleScans && m.first != null && m.value != null && (
                    <div className="mt-3 flex flex-col gap-1">
                      {m.first !== m.value && (
                        <DeltaBadge
                          current={m.value!}
                          baseline={m.first}
                          unit={m.unit}
                          downIsGood={m.downIsGood}
                          label=" since start"
                        />
                      )}
                      {prevScan && m.prev != null && m.prev !== m.value && (
                        <DeltaBadge
                          current={m.value!}
                          baseline={m.prev}
                          unit={m.unit}
                          downIsGood={m.downIsGood}
                          label=" vs prev"
                        />
                      )}
                    </div>
                  )}
                  {!hasMultipleScans && (
                    <p className="text-[10px] text-text-secondary/50 mt-2">Baseline</p>
                  )}
                </div>
              ))}
            </div>

            {/* Scan history footnote */}
            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-[11px] text-text-secondary/60">
                {hasMultipleScans
                  ? `${chronoScans.length} scans · started ${fmt(firstScan!.scan_date)}`
                  : `1 scan recorded · ${fmt(currentScan.scan_date)}`}
              </p>
              {hasMultipleScans && (
                <p className="text-[11px] text-text-secondary/60">
                  Latest: {fmt(currentScan.scan_date)}
                </p>
              )}
            </div>

            {/* Scan comparison table — only show when 2+ scans */}
            {hasMultipleScans && (
              <div className="mt-4 bg-bg-card border border-border-light rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border-light">
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Scan History</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-light text-text-secondary">
                        <th className="text-left px-4 py-2 font-medium"></th>
                        {firstScan && <th className="text-right px-4 py-2 font-medium">First<br /><span className="font-normal opacity-60">{fmtShort(firstScan.scan_date)}</span></th>}
                        {prevScan && <th className="text-right px-4 py-2 font-medium">Previous<br /><span className="font-normal opacity-60">{fmtShort(prevScan.scan_date)}</span></th>}
                        <th className="text-right px-4 py-2 font-medium">Current<br /><span className="font-normal opacity-60">{fmtShort(currentScan.scan_date)}</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {bodyMetrics.map((m) => (
                        <tr key={m.key} className="hover:bg-bg-main/30">
                          <td className="px-4 py-2.5 text-text-secondary">{m.label}</td>
                          {firstScan && (
                            <td className="px-4 py-2.5 text-right text-text-secondary">
                              {m.first != null ? `${round1(m.first)}${m.unit}` : "—"}
                            </td>
                          )}
                          {prevScan && (
                            <td className="px-4 py-2.5 text-right text-text-secondary">
                              {m.prev != null ? `${round1(m.prev)}${m.unit}` : "—"}
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-right font-bold text-text-primary">
                            {round1(m.value!)}{m.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Strength & Conditioning ───────────────────────────────── */}
      <section>
        <SectionHeading>Strength & Conditioning</SectionHeading>

        {exercises.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">🏋️</p>
            <p className="text-text-primary font-semibold text-sm mb-1">No results yet</p>
            <p className="text-text-secondary text-xs">Your S&C test results will appear here after your first testing session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exercises.map((ex) => (
              <div key={ex.exercise} className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

                {/* Exercise name + PB badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide leading-snug">{ex.exercise}</p>
                  {ex.isPBCurrent && (
                    <span className="shrink-0 text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                      ★ PB
                    </span>
                  )}
                  {!ex.isPBCurrent && (
                    <span className="shrink-0 text-[10px] text-text-secondary/50">PB {ex.pbValue}</span>
                  )}
                </div>

                {/* Current value — big */}
                <p className="text-4xl font-bold text-text-primary leading-none tracking-tight mb-1">
                  {ex.currentResult.result_value}
                </p>
                <p className="text-[10px] text-text-secondary/60 mb-3">{fmt(ex.currentResult.tested_date)}</p>

                {/* Comparison row — only shown when history exists */}
                {ex.hasHistory && (
                  <div className="border-t border-border-light pt-3 flex gap-2 flex-wrap">
                    <DeltaBadge
                      current={ex.currentResult.result_value}
                      baseline={ex.firstResult.result_value}
                      unit=""
                      label={` since ${fmtShort(ex.firstResult.tested_date)}`}
                    />
                    {ex.prevResult && (
                      <DeltaBadge
                        current={ex.currentResult.result_value}
                        baseline={ex.prevResult.result_value}
                        unit=""
                        label={` vs ${fmtShort(ex.prevResult.tested_date)}`}
                      />
                    )}
                  </div>
                )}
                {!ex.hasHistory && (
                  <p className="text-[10px] text-text-secondary/50">First result — baseline set</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming Events ───────────────────────────────────────── */}
      <section>
        <SectionHeading>Upcoming Goals & Events</SectionHeading>

        {events.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">🏅</p>
            <p className="text-text-primary font-semibold text-sm mb-1">No events added yet</p>
            {goalsHref && (
              <Link href={goalsHref} className="text-brand text-xs hover:underline transition-colors mt-1 inline-block">
                Add an event in My Goals →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => {
              const daysUntil = Math.round(
                (new Date(ev.event_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isImminent = daysUntil <= 7;
              const isSoon = daysUntil <= 30;
              return (
                <div
                  key={ev.id}
                  className={`flex items-center justify-between px-4 py-4 bg-bg-card border rounded-2xl relative overflow-hidden ${
                    isImminent ? "border-amber-500/30" : "border-border-light"
                  }`}
                >
                  {isImminent && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />
                  )}
                  {!isImminent && isSoon && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand" />
                  )}
                  <div className="ml-2">
                    <p className="text-text-primary font-semibold text-sm">{ev.event_name}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{fmt(ev.event_date)}</p>
                  </div>
                  <div className={`text-center min-w-[3.5rem] px-3 py-2 rounded-xl ${
                    isImminent
                      ? "bg-amber-500/10"
                      : isSoon
                      ? "bg-brand/10"
                      : "bg-bg-surface"
                  }`}>
                    <p className={`text-xl font-bold leading-none ${
                      isImminent ? "text-amber-500" : isSoon ? "text-brand" : "text-text-secondary"
                    }`}>
                      {daysUntil === 0 ? "!" : daysUntil}
                    </p>
                    <p className={`text-[10px] font-medium mt-0.5 ${
                      isImminent ? "text-amber-500/70" : isSoon ? "text-brand/70" : "text-text-secondary/60"
                    }`}>
                      {daysUntil === 0 ? "today" : daysUntil === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
