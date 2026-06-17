import Link from "next/link";
import { cookies } from "next/headers";
import {
  fetchMemberScans,
  fetchMemberStrengthResults,
  fetchAllMemberEvents,
} from "@/lib/staffhub";
import type { InBodyScan, StrengthResult, MemberEvent } from "@/lib/staffhub";

export const dynamic = "force-dynamic";

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

function delta(current: number, baseline: number, unit: string, downIsGood = false) {
  const diff = round1(current - baseline);
  if (diff === 0) return null;
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

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border-light rounded-xl p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
      {sub && <p className="mt-1">{sub}</p>}
    </div>
  );
}

export default async function AthleteSnapshotPage() {
  const cookieStore = await cookies();
  const gymMasterId = cookieStore.get("gymmaster_member_id")?.value ?? "";

  const [scans, strengthResults, events] = await Promise.all([
    gymMasterId ? fetchMemberScans(gymMasterId) : Promise.resolve([] as InBodyScan[]),
    gymMasterId ? fetchMemberStrengthResults(gymMasterId) : Promise.resolve([] as StrengthResult[]),
    gymMasterId ? fetchAllMemberEvents(gymMasterId) : Promise.resolve([] as MemberEvent[]),
  ]);

  // scans come newest-first; flip for chronological access
  const chronoScans = [...scans].reverse();
  const latest = chronoScans.at(-1) ?? null;
  const first = chronoScans.at(0) ?? null;
  const hasProgress = latest && first && latest.id !== first.id;

  // Personal bests per exercise (highest result_value)
  const pbMap = new Map<string, StrengthResult>();
  for (const r of strengthResults) {
    const existing = pbMap.get(r.exercise);
    if (!existing || r.result_value > existing.result_value) {
      pbMap.set(r.exercise, r);
    }
  }
  const pbs = Array.from(pbMap.values()).sort((a, b) => a.exercise.localeCompare(b.exercise));

  // Most recent testing block (group by tested_date, pick newest date with >1 exercise)
  const dateGroups = new Map<string, StrengthResult[]>();
  for (const r of strengthResults) {
    const g = dateGroups.get(r.tested_date) ?? [];
    g.push(r);
    dateGroups.set(r.tested_date, g);
  }
  const recentBlockDate = [...dateGroups.keys()].sort().at(-1);
  const recentBlock = recentBlockDate ? dateGroups.get(recentBlockDate)! : [];

  return (
    <div className="max-w-2xl">
      {/* Back nav */}
      <Link
        href="/results"
        className="text-xs text-brand hover:text-brand-dark transition-colors font-medium inline-flex items-center gap-1 mb-3"
      >
        ← My Results
      </Link>

      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Results</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Athlete Snapshot
      </h1>

      <div className="space-y-8">
        {/* Body Composition */}
        <section>
          <SectionHeading>Body Composition</SectionHeading>
          {!latest ? (
            <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
              <p className="text-text-secondary text-sm">No InBody scans recorded yet.</p>
              <p className="text-text-secondary text-xs mt-1">Speak to a coach to book your first scan.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-secondary mb-3">Latest scan: {fmt(latest.scan_date)}</p>
              <div className="grid grid-cols-3 gap-3">
                {latest.weight != null && (
                  <StatCard
                    label="Weight"
                    value={`${round1(latest.weight)} kg`}
                    sub={hasProgress && first!.weight != null
                      ? delta(latest.weight, first!.weight, " kg", true)
                      : undefined}
                  />
                )}
                {latest.smm != null && (
                  <StatCard
                    label="Muscle Mass"
                    value={`${round1(latest.smm)} kg`}
                    sub={hasProgress && first!.smm != null
                      ? delta(latest.smm, first!.smm, " kg")
                      : undefined}
                  />
                )}
                {latest.bf_pct != null && (
                  <StatCard
                    label="Body Fat"
                    value={`${round1(latest.bf_pct)}%`}
                    sub={hasProgress && first!.bf_pct != null
                      ? delta(latest.bf_pct, first!.bf_pct, "%", true)
                      : undefined}
                  />
                )}
              </div>
              {hasProgress && (
                <p className="text-xs text-text-secondary mt-2">
                  Progress since first scan ({fmt(first!.scan_date)}) — {chronoScans.length} scan{chronoScans.length !== 1 ? "s" : ""} total
                </p>
              )}
            </>
          )}
        </section>

        {/* Strength PBs */}
        <section>
          <SectionHeading>Strength Personal Bests</SectionHeading>
          {pbs.length === 0 ? (
            <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
              <p className="text-text-secondary text-sm">No S&C results recorded yet.</p>
            </div>
          ) : (
            <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {pbs.map((pb, i) => (
                    <tr
                      key={pb.exercise}
                      className={i < pbs.length - 1 ? "border-b border-border-light" : ""}
                    >
                      <td className="px-4 py-3 text-text-primary font-medium">{pb.exercise}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-brand">{pb.result_value}</span>
                        {pb.result_notes && (
                          <span className="text-text-secondary text-xs ml-1">{pb.result_notes}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-text-secondary whitespace-nowrap">
                        {fmt(pb.tested_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Most recent testing block */}
        {recentBlock.length > 0 && recentBlockDate && (
          <section>
            <SectionHeading>Latest Testing Block — {fmt(recentBlockDate)}</SectionHeading>
            <div className="bg-bg-card border border-border-light rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {recentBlock.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i < recentBlock.length - 1 ? "border-b border-border-light" : ""}
                    >
                      <td className="px-4 py-3 text-text-primary">{r.exercise}</td>
                      <td className="px-4 py-3 text-right font-bold text-text-primary">
                        {r.result_value}
                        {r.result_notes && (
                          <span className="text-text-secondary font-normal text-xs ml-1">{r.result_notes}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Upcoming Events & Goals */}
        <section>
          <SectionHeading>Upcoming Goals & Events</SectionHeading>
          {events.length === 0 ? (
            <div className="bg-bg-card border border-border-light rounded-xl p-6 text-center">
              <p className="text-text-secondary text-sm">No upcoming events added yet.</p>
              <Link
                href="/goals"
                className="text-brand text-xs hover:text-brand-dark transition-colors mt-2 inline-block"
              >
                Add an event in My Goals →
              </Link>
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
    </div>
  );
}
