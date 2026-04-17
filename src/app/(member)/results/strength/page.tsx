import Link from "next/link";

// ─── Seed data ─────────────────────────────────────────────────────────────────

type TestResult = {
  test: string;
  unit: string;
  higherIsBetter: boolean;
  blocks: { block: string; result: number; isPB: boolean }[];
};

const SEED_RESULTS: TestResult[] = [
  {
    test: "Back Squat",
    unit: "kg",
    higherIsBetter: true,
    blocks: [
      { block: "Oct 2025", result: 110, isPB: false },
      { block: "Jan 2026", result: 115, isPB: false },
      { block: "Apr 2026", result: 120, isPB: true },
    ],
  },
  {
    test: "Deadlift",
    unit: "kg",
    higherIsBetter: true,
    blocks: [
      { block: "Oct 2025", result: 145, isPB: false },
      { block: "Jan 2026", result: 155, isPB: false },
      { block: "Apr 2026", result: 160, isPB: true },
    ],
  },
  {
    test: "Strict Press",
    unit: "kg",
    higherIsBetter: true,
    blocks: [
      { block: "Oct 2025", result: 55, isPB: false },
      { block: "Jan 2026", result: 57.5, isPB: false },
      { block: "Apr 2026", result: 60, isPB: true },
    ],
  },
  {
    test: "500m Row",
    unit: "sec",
    higherIsBetter: false,
    blocks: [
      { block: "Oct 2025", result: 102, isPB: false },
      { block: "Jan 2026", result: 98, isPB: false },
      { block: "Apr 2026", result: 95, isPB: true },
    ],
  },
  {
    test: "Pull-Up Max",
    unit: "reps",
    higherIsBetter: true,
    blocks: [
      { block: "Oct 2025", result: 8, isPB: false },
      { block: "Jan 2026", result: 10, isPB: false },
      { block: "Apr 2026", result: 12, isPB: true },
    ],
  },
  {
    test: "1RM Bench Press",
    unit: "kg",
    higherIsBetter: true,
    blocks: [
      { block: "Oct 2025", result: 82.5, isPB: false },
      { block: "Jan 2026", result: 87.5, isPB: false },
      { block: "Apr 2026", result: 90, isPB: true },
    ],
  },
];

const ALL_BLOCKS = ["Oct 2025", "Jan 2026", "Apr 2026"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatRow(result: number, unit: string) {
  if (unit === "sec") {
    const m = Math.floor(result / 60);
    const s = Math.round(result % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
  }
  return `${result}${unit}`;
}

function trend(r: TestResult): "up" | "down" | "flat" {
  const vals = r.blocks.map((b) => b.result);
  if (vals.length < 2) return "flat";
  const diff = vals[vals.length - 1] - vals[0];
  if (Math.abs(diff) < 0.01) return "flat";
  return diff > 0 ? "up" : "down";
}

function trendIsGood(r: TestResult) {
  const t = trend(r);
  if (t === "flat") return null;
  return r.higherIsBetter ? t === "up" : t === "down";
}

// ─── Mini bar chart for a test ────────────────────────────────────────────────

function TrendBars({ result }: { result: TestResult }) {
  const values = result.blocks.map((b) => b.result);
  const min = Math.min(...values) * (result.higherIsBetter ? 0.9 : 1);
  const max = Math.max(...values) * (result.higherIsBetter ? 1 : 0.9);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-8">
      {result.blocks.map((b, i) => {
        const pct = ((b.result - min) / range) * 100;
        const isLatest = i === result.blocks.length - 1;
        return (
          <div
            key={b.block}
            className="flex flex-col items-center gap-0.5"
            title={`${b.block}: ${formatRow(b.result, result.unit)}`}
          >
            <div
              className={`w-4 rounded-sm transition-all ${
                isLatest ? "bg-brand" : "bg-border-light"
              }`}
              style={{ height: `${Math.max(pct, 8)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StrengthPage() {
  const pbCount = SEED_RESULTS.filter(
    (r) => r.blocks[r.blocks.length - 1]?.isPB
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/results"
          className="text-text-secondary hover:text-brand transition-colors text-sm"
        >
          ← Results
        </Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-brand font-semibold mb-0.5">
            Results
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-[0.95]">
            Strength &amp; Conditioning
          </h1>
        </div>
        <span className="text-3xl mt-1">🏋️</span>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Tests tracked", value: SEED_RESULTS.length, colour: "" },
          { label: "Testing blocks", value: ALL_BLOCKS.length, colour: "" },
          {
            label: "PBs in Apr 2026",
            value: pbCount,
            colour: "text-status-green",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-bg-card border border-border-light rounded-2xl p-4 relative overflow-hidden shadow-sm text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p
              className={`font-display text-3xl leading-none mb-1 ${
                s.colour || "text-text-primary"
              }`}
            >
              {s.value}
            </p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SEED_RESULTS.map((result) => {
          const latest = result.blocks[result.blocks.length - 1];
          const first = result.blocks[0];
          const diff = latest.result - first.result;
          const good = trendIsGood(result);

          return (
            <div
              key={result.test}
              className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

              {/* Title row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">
                    {result.test}
                  </h3>
                  <p className="text-xs text-text-secondary">{result.unit}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-display text-2xl text-text-primary leading-none">
                      {formatRow(latest.result, result.unit)}
                    </span>
                    {latest.isPB && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold shrink-0">
                        🏆 PB
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary">Apr 2026</p>
                </div>
              </div>

              {/* Mini trend bars */}
              <div className="flex items-end justify-between mb-3">
                <TrendBars result={result} />
                <div className="text-right">
                  {good !== null && (
                    <span
                      className={`text-xs font-semibold ${
                        good ? "text-status-green" : "text-status-red"
                      }`}
                    >
                      {good ? "↑" : "↓"}{" "}
                      {Math.abs(diff) % 1 === 0
                        ? Math.abs(diff)
                        : Math.abs(diff).toFixed(1)}
                      {result.unit} since {first.block}
                    </span>
                  )}
                </div>
              </div>

              {/* Block history row */}
              <div className="flex gap-2 border-t border-border-light pt-3">
                {result.blocks.map((b, i) => {
                  const isLatest = i === result.blocks.length - 1;
                  return (
                    <div key={b.block} className="flex-1 text-center">
                      <p className="text-[10px] text-text-secondary mb-0.5">
                        {b.block}
                      </p>
                      <p
                        className={`font-data text-xs font-semibold ${
                          isLatest ? "text-brand" : "text-text-secondary"
                        }`}
                      >
                        {formatRow(b.result, result.unit)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-text-secondary mt-6 text-center">
        Showing results from {ALL_BLOCKS.length} testing blocks ·{" "}
        <Link href="/results" className="text-brand hover:text-brand-dark transition-colors">
          Back to Results
        </Link>
      </p>
    </div>
  );
}
