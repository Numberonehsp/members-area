import Link from "next/link";
import { cookies } from "next/headers";
import { fetchMemberScans } from "@/lib/staffhub";
import type { InBodyScan } from "@/lib/staffhub";
import BodyCompositionChart from "@/components/results/BodyCompositionChart";

type DeltaDisplayProps = {
  value: number;
  unit: string;
  downIsGood?: boolean;
};

function DeltaDisplay({ value, unit, downIsGood = false }: DeltaDisplayProps) {
  const isGood = downIsGood ? value < 0 : value > 0;
  const colour = isGood
    ? "text-status-green"
    : value === 0
    ? "text-text-secondary"
    : "text-status-red";
  const arrow = value === 0 ? "→" : value > 0 ? "↑" : "↓";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-xs font-semibold ${colour} inline-flex items-center gap-0.5`}>
      {arrow} {sign}{value}{unit}
    </span>
  );
}

function formatDateLabel(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function NoScans() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/results"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium inline-flex items-center gap-1 mb-3"
        >
          ← My Results
        </Link>
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Results</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">Body Composition</h1>
      </div>
      <div className="bg-bg-card border border-border-light rounded-2xl p-10 text-center shadow-sm">
        <p className="text-text-secondary text-sm">No InBody scans recorded yet.</p>
        <p className="text-text-secondary text-xs mt-2">Speak to a coach to book your first scan.</p>
      </div>
    </div>
  );
}

export default async function BodyCompositionPage() {
  const cookieStore = await cookies();
  const gymMasterId = cookieStore.get("gymmaster_member_id")?.value ?? "";

  const scans: InBodyScan[] = gymMasterId
    ? await fetchMemberScans(gymMasterId)
    : [];

  // fetchMemberScans returns newest first; we want oldest first for charts/deltas
  const chronological = [...scans].reverse();

  if (chronological.length === 0) return <NoScans />;

  const latest = chronological[chronological.length - 1];
  const first = chronological[0];

  const weightDelta = round1((latest.weight ?? 0) - (first.weight ?? 0));
  const smmDelta    = round1((latest.smm ?? 0)    - (first.smm ?? 0));
  const bfPctDelta  = round1((latest.bf_pct ?? 0) - (first.bf_pct ?? 0));
  const bfMassDelta = round1((latest.bf_mass ?? 0) - (first.bf_mass ?? 0));

  const maxWeight = Math.max(...chronological.map((s) => s.weight ?? 0));

  const firstLabel = formatDateLabel(first.scan_date);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/results"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium inline-flex items-center gap-1 mb-3"
        >
          ← My Results
        </Link>
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Results</p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">Body Composition</h1>
      </div>

      {/* Latest scan card */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden mb-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-semibold text-text-primary text-sm">Latest Scan</h2>
          <span className="text-[11px] text-text-secondary">{formatDateLabel(latest.scan_date)}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border-light">
          {[
            { label: "Weight",   value: latest.weight,  unit: "kg", delta: weightDelta,  downIsGood: true },
            { label: "SMM",      value: latest.smm,     unit: "kg", delta: smmDelta,     downIsGood: false },
            { label: "Body Fat", value: latest.bf_pct,  unit: "%",  delta: bfPctDelta,   downIsGood: true },
            { label: "BF Mass",  value: latest.bf_mass, unit: "kg", delta: bfMassDelta,  downIsGood: true },
          ].map(({ label, value, unit, delta, downIsGood }) => (
            <div key={label} className="p-5">
              <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-semibold">{label}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-data text-3xl font-semibold text-text-primary leading-none">
                  {value ?? "—"}
                </span>
                {value != null && <span className="text-xs text-text-secondary">{unit}</span>}
              </div>
              {chronological.length > 1 && value != null && (
                <>
                  <DeltaDisplay value={delta} unit={unit} downIsGood={downIsGood} />
                  <p className="text-[10px] text-text-secondary mt-0.5">since {firstLabel}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress summary — only shown when there are at least 2 scans with data */}
      {chronological.length > 1 && latest.weight != null && first.weight != null && (
        <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden mb-4">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary text-sm mb-2">Progress Summary</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Since {firstLabel},{" "}
            {weightDelta < 0 ? (
              <>
                you&apos;ve lost{" "}
                <span className="text-status-green font-semibold">{Math.abs(weightDelta)}kg</span>
              </>
            ) : weightDelta > 0 ? (
              <>
                your weight has increased by{" "}
                <span className="text-status-red font-semibold">{weightDelta}kg</span>
              </>
            ) : (
              <>your weight has remained stable</>
            )}
            {latest.bf_pct != null && first.bf_pct != null && bfPctDelta !== 0 && (
              <>
                {" "}and {bfPctDelta < 0 ? "reduced" : "increased"} body fat by{" "}
                <span className={bfPctDelta < 0 ? "text-status-green font-semibold" : "text-status-red font-semibold"}>
                  {Math.abs(bfPctDelta)}%
                </span>
              </>
            )}
            {latest.smm != null && first.smm != null && smmDelta !== 0 && (
              <>
                , while your skeletal muscle mass has{" "}
                {smmDelta > 0 ? (
                  <>increased by <span className="text-status-green font-semibold">+{smmDelta}kg</span></>
                ) : (
                  <>decreased by <span className="text-status-red font-semibold">{Math.abs(smmDelta)}kg</span></>
                )}
              </>
            )}
            .
          </p>
        </div>
      )}

      {/* Interactive line chart — last 5 scans, pick 1 or 2 metrics */}
      {chronological.length > 0 && <BodyCompositionChart scans={scans} />}

      {/* Scan history table */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <h2 className="font-semibold text-text-primary text-sm">Scan History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-bg-main/50">
                {["Date", "Weight", "SMM", "BF%", "BF Mass"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {[...chronological].reverse().map((scan, i) => {
                const isLatest = i === 0;
                return (
                  <tr
                    key={scan.scan_date}
                    className={isLatest ? "bg-brand/5" : "hover:bg-bg-main/60 transition-colors"}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary text-xs">
                      {formatDateLabel(scan.scan_date)}
                      {isLatest && (
                        <span className="ml-2 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.weight != null ? `${scan.weight} kg` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.smm != null ? `${scan.smm} kg` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bf_pct != null ? `${scan.bf_pct}%` : "—"}</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bf_mass != null ? `${scan.bf_mass} kg` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border-light">
          <span className="text-xs text-text-secondary">{scans.length} scan{scans.length !== 1 ? "s" : ""} recorded</span>
        </div>
      </div>
    </div>
  );
}
