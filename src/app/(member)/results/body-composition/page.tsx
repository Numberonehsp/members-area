import Link from "next/link";

type Scan = {
  date: string;
  dateLabel: string;
  weight: number;
  smm: number;
  bfPct: number;
  bfMass: number;
};

const SCANS: Scan[] = [
  { date: "2025-10-01", dateLabel: "1 Oct 2025", weight: 86.2, smm: 35.4, bfPct: 21.2, bfMass: 18.3 },
  { date: "2025-11-15", dateLabel: "15 Nov 2025", weight: 85.1, smm: 35.7, bfPct: 20.8, bfMass: 17.7 },
  { date: "2026-01-10", dateLabel: "10 Jan 2026", weight: 84.3, smm: 36.0, bfPct: 20.1, bfMass: 16.9 },
  { date: "2026-02-20", dateLabel: "20 Feb 2026", weight: 83.2, smm: 36.1, bfPct: 19.4, bfMass: 16.1 },
  { date: "2026-04-03", dateLabel: "3 Apr 2026",  weight: 82.4, smm: 36.1, bfPct: 18.6, bfMass: 15.3 },
];

// Latest scan is last in array
const latest = SCANS[SCANS.length - 1];
const first = SCANS[0];

function delta(current: number, baseline: number) {
  return Math.round((current - baseline) * 10) / 10;
}

type DeltaDisplayProps = {
  value: number;
  unit: string;
  // true = "down is good" (weight, BF), false = "up is good" (SMM)
  downIsGood?: boolean;
};

function DeltaDisplay({ value, unit, downIsGood = false }: DeltaDisplayProps) {
  const isPositive = value > 0;
  const isGood = downIsGood ? value < 0 : value > 0;
  const colour = isGood ? "text-status-green" : value === 0 ? "text-text-secondary" : "text-status-red";
  const arrow = value === 0 ? "→" : isPositive ? "↑" : "↓";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-xs font-semibold ${colour} inline-flex items-center gap-0.5`}>
      {arrow} {sign}{value}{unit}
    </span>
  );
}

export default function BodyCompositionPage() {
  const weightDelta   = delta(latest.weight,  first.weight);
  const smmDelta      = delta(latest.smm,     first.smm);
  const bfPctDelta    = delta(latest.bfPct,   first.bfPct);
  const bfMassDelta   = delta(latest.bfMass,  first.bfMass);

  // CSS bar: max weight used as 100% baseline (cosmetic only)
  const maxWeight = Math.max(...SCANS.map((s) => s.weight));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/results"
          className="text-xs text-brand hover:text-brand-dark transition-colors font-medium inline-flex items-center gap-1 mb-3"
        >
          ← My Results
        </Link>
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
          Results
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95]">
          Body Composition
        </h1>
      </div>

      {/* Latest scan card */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden mb-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-semibold text-text-primary text-sm">Latest Scan</h2>
          <span className="text-[11px] text-text-secondary">{latest.dateLabel}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border-light">
          {[
            { label: "Weight",     value: latest.weight,  unit: "kg",  delta: weightDelta,  downIsGood: true },
            { label: "SMM",        value: latest.smm,     unit: "kg",  delta: smmDelta,     downIsGood: false },
            { label: "Body Fat",   value: latest.bfPct,   unit: "%",   delta: bfPctDelta,   downIsGood: true },
            { label: "BF Mass",    value: latest.bfMass,  unit: "kg",  delta: bfMassDelta,  downIsGood: true },
          ].map(({ label, value, unit, delta: d, downIsGood }) => (
            <div key={label} className="p-5">
              <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-semibold">
                {label}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-data text-3xl font-semibold text-text-primary leading-none">
                  {value}
                </span>
                <span className="text-xs text-text-secondary">{unit}</span>
              </div>
              <DeltaDisplay value={d} unit={unit} downIsGood={downIsGood} />
              <p className="text-[10px] text-text-secondary mt-0.5">since Oct 2025</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend summary */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden mb-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <h2 className="font-semibold text-text-primary text-sm mb-2">Progress Summary</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Since October 2025, you&apos;ve lost{" "}
          <span className="text-status-green font-semibold">
            {Math.abs(weightDelta)}kg
          </span>{" "}
          and reduced body fat by{" "}
          <span className="text-status-green font-semibold">
            {Math.abs(bfPctDelta)}%
          </span>
          , while your skeletal muscle mass has increased by{" "}
          <span className="text-status-green font-semibold">
            +{smmDelta}kg
          </span>
          . That&apos;s a great body recomposition result — keep it up.
        </p>
      </div>

      {/* Weight trend bars */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden mb-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
        <h2 className="font-semibold text-text-primary text-sm mb-4">Weight Trend</h2>
        <div className="space-y-3">
          {[...SCANS].reverse().map((scan, i) => {
            const pct = Math.round((scan.weight / maxWeight) * 100);
            const isLatest = i === 0;
            return (
              <div key={scan.date} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-24 shrink-0 font-data">{scan.dateLabel}</span>
                <div className="flex-1 bg-border-light rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isLatest ? "bg-brand" : "bg-brand/40"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs font-data font-semibold w-16 text-right ${isLatest ? "text-text-primary" : "text-text-secondary"}`}>
                  {scan.weight} kg
                </span>
              </div>
            );
          })}
        </div>
      </div>

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
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {[...SCANS].reverse().map((scan, i) => {
                const isLatest = i === 0;
                return (
                  <tr
                    key={scan.date}
                    className={isLatest ? "bg-brand/5" : "hover:bg-bg-main/60 transition-colors"}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary text-xs">
                      {scan.dateLabel}
                      {isLatest && (
                        <span className="ml-2 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.weight} kg</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.smm} kg</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bfPct}%</td>
                    <td className="px-4 py-3 font-data text-text-primary">{scan.bfMass} kg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border-light">
          <span className="text-xs text-text-secondary">{SCANS.length} scans recorded</span>
        </div>
      </div>
    </div>
  );
}
