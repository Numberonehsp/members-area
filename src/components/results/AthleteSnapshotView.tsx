import Link from "next/link";
import type { InBodyScan, StrengthResult, MemberEvent } from "@/lib/staffhub";

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function Delta({ current, baseline, unit, downIsGood = false }: {
  current: number; baseline: number; unit: string; downIsGood?: boolean;
}) {
  const diff = round1(current - baseline);
  if (diff === 0) return <span className="text-xs text-text-secondary">—</span>;
  const isGood = downIsGood ? diff < 0 : diff > 0;
  const colour = isGood ? "text-green-400" : "text-red-400";
  const sign = diff > 0 ? "+" : "";
  return <span className={`${colour} text-xs font-semibold`}>{sign}{diff}{unit}</span>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
      {children}
    </h2>
  );
}

function ColHead({ label, date }: { label: string; date?: string }) {
  return (
    <th className="pb-2 text-right first:text-left font-semibold text-text-secondary text-[11px]">
      {label}
      {date && <span className="block text-[10px] font-normal text-text-secondary/60">{fmt(date)}</span>}
    </th>
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
  // scans come newest-first; reverse for chronological
  const chronoScans = [...scans].reverse();
  const first = chronoScans.at(0) ?? null;
  const prev = chronoScans.length >= 3 ? chronoScans.at(-2)! : null;
  const current = chronoScans.at(-1) ?? null;
  const showPrev = prev && prev.id !== first?.id;

  // Per-exercise: sort oldest→newest, derive first/prev/current
  type ExerciseSummary = {
    exercise: string;
    firstResult: StrengthResult;
    prevResult: StrengthResult | null;
    currentResult: StrengthResult;
    pbValue: number;
    isPBCurrent: boolean;
  }

  const exerciseMap = new Map<string, StrengthResult[]>();
  for (const r of strengthResults) {
    const arr = exerciseMap.get(r.exercise) ?? [];
    arr.push(r);
    exerciseMap.set(r.exercise, arr);
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
      };
    })
    .sort((a, b) => a.exercise.localeCompare(b.exercise));

  const showStrengthPrev = exercises.some((e) => e.prevResult !== null);

  return (
    <div className="space-y-8">

      {/* Body Composition */}
      <section>
        <SectionHeading>Body Composition</SectionHeading>
        {!current ? (
          <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
            <p className="text-text-secondary text-sm">No InBody scans recorded yet.</p>
            {!isCoach && <p className="text-text-secondary text-xs mt-1">Speak to a coach to book your first scan.</p>}
          </div>
        ) : (
          <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <ColHead label="Metric" />
                  <ColHead label="First" date={first?.scan_date} />
                  {showPrev && <ColHead label="Previous" date={prev!.scan_date} />}
                  <ColHead label="Current" date={current.scan_date} />
                  <ColHead label="vs First" />
                  {showPrev && <ColHead label="vs Prev" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {[
                  { key: "weight", label: "Weight", unit: " kg", downIsGood: true,
                    first: first?.weight, prev: prev?.weight, current: current.weight },
                  { key: "smm", label: "Muscle Mass", unit: " kg", downIsGood: false,
                    first: first?.smm, prev: prev?.smm, current: current.smm },
                  { key: "bf_pct", label: "Body Fat %", unit: "%", downIsGood: true,
                    first: first?.bf_pct, prev: prev?.bf_pct, current: current.bf_pct },
                  { key: "bf_mass", label: "BF Mass", unit: " kg", downIsGood: true,
                    first: first?.bf_mass, prev: prev?.bf_mass, current: current.bf_mass },
                ].filter((row) => row.current != null).map((row) => (
                  <tr key={row.key} className="hover:bg-bg-main/40">
                    <td className="px-4 py-3 text-text-secondary text-xs">{row.label}</td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {row.first != null ? `${round1(row.first)}${row.unit}` : "—"}
                    </td>
                    {showPrev && (
                      <td className="px-4 py-3 text-right text-xs text-text-secondary">
                        {row.prev != null ? `${round1(row.prev)}${row.unit}` : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-bold text-text-primary text-sm">
                      {round1(row.current!)}{row.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.first != null && row.current != null
                        ? <Delta current={row.current!} baseline={row.first} unit={row.unit} downIsGood={row.downIsGood} />
                        : <span className="text-xs text-text-secondary">—</span>}
                    </td>
                    {showPrev && (
                      <td className="px-4 py-3 text-right">
                        {row.prev != null && row.current != null
                          ? <Delta current={row.current!} baseline={row.prev} unit={row.unit} downIsGood={row.downIsGood} />
                          : <span className="text-xs text-text-secondary">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-[10px] text-text-secondary/60 border-t border-border-light">
              {chronoScans.length} scan{chronoScans.length !== 1 ? "s" : ""} on record
            </p>
          </div>
        )}
      </section>

      {/* Strength */}
      <section>
        <SectionHeading>Strength & Conditioning</SectionHeading>
        {exercises.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
            <p className="text-text-secondary text-sm">No S&C results recorded yet.</p>
          </div>
        ) : (
          <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <ColHead label="Exercise" />
                  <ColHead label="First" />
                  {showStrengthPrev && <ColHead label="Previous" />}
                  <ColHead label="Current" />
                  <ColHead label="vs First" />
                  {showStrengthPrev && <ColHead label="vs Prev" />}
                  <ColHead label="PB" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {exercises.map((ex) => (
                  <tr key={ex.exercise} className="hover:bg-bg-main/40">
                    <td className="px-4 py-3 font-medium text-text-primary text-xs">{ex.exercise}</td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {ex.firstResult.id !== ex.currentResult.id
                        ? <>{ex.firstResult.result_value}<span className="block text-[10px] text-text-secondary/60">{fmt(ex.firstResult.tested_date)}</span></>
                        : "—"}
                    </td>
                    {showStrengthPrev && (
                      <td className="px-4 py-3 text-right text-xs text-text-secondary">
                        {ex.prevResult
                          ? <>{ex.prevResult.result_value}<span className="block text-[10px] text-text-secondary/60">{fmt(ex.prevResult.tested_date)}</span></>
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-bold text-text-primary">
                      {ex.currentResult.result_value}
                      <span className="block text-[10px] font-normal text-text-secondary/60">{fmt(ex.currentResult.tested_date)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ex.firstResult.id !== ex.currentResult.id
                        ? <Delta current={ex.currentResult.result_value} baseline={ex.firstResult.result_value} unit="" />
                        : <span className="text-xs text-text-secondary">—</span>}
                    </td>
                    {showStrengthPrev && (
                      <td className="px-4 py-3 text-right">
                        {ex.prevResult
                          ? <Delta current={ex.currentResult.result_value} baseline={ex.prevResult.result_value} unit="" />
                          : <span className="text-xs text-text-secondary">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold ${ex.isPBCurrent ? "text-green-400" : "text-brand"}`}>
                        {ex.pbValue} {ex.isPBCurrent ? "★" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section>
        <SectionHeading>Upcoming Goals & Events</SectionHeading>
        {events.length === 0 ? (
          <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
            <p className="text-text-secondary text-sm">No upcoming events added yet.</p>
            {goalsHref && (
              <Link href={goalsHref} className="text-brand text-xs hover:text-brand-dark transition-colors mt-2 inline-block">
                Add an event in My Goals →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
            {events.map((ev, i) => {
              const daysUntil = Math.round(
                (new Date(ev.event_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={ev.id}
                  className={`flex items-center justify-between px-4 py-3 ${i < events.length - 1 ? "border-b border-border-light" : ""}`}
                >
                  <div>
                    <p className="text-text-primary font-medium text-sm">{ev.event_name}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{fmt(ev.event_date)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    daysUntil <= 7
                      ? "bg-amber-500/10 text-amber-400"
                      : daysUntil <= 30
                      ? "bg-brand/10 text-brand"
                      : "bg-bg-surface text-text-secondary"
                  }`}>
                    {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
