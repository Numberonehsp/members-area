"use client";

// The exercise list is fixed and mirrors StrengthClient.tsx exactly.
// It is displayed here as a reference — staff cannot customise it
// without a code change, which keeps Members Area results consistent.

type TestType = {
  name: string;
  unit: string;
  higherIsBetter: boolean;
};

const TEST_TYPES: TestType[] = [
  { name: "Hex Deadlift 3RM",  unit: "kg",   higherIsBetter: true  },
  { name: "Back Squat 3RM",    unit: "kg",   higherIsBetter: true  },
  { name: "Bench Press 3RM",   unit: "kg",   higherIsBetter: true  },
  { name: "Clean & Jerk 1RM",  unit: "kg",   higherIsBetter: true  },
  { name: "Snatch 1RM",        unit: "kg",   higherIsBetter: true  },
  { name: "Pull Up Max Reps",  unit: "reps", higherIsBetter: true  },
  { name: "9min AMRAP",        unit: "reps", higherIsBetter: true  },
  { name: "6min Time Trial",   unit: "m",    higherIsBetter: true  },
  { name: "5km Run",           unit: "min",  higherIsBetter: false },
  { name: "10km Run",          unit: "min",  higherIsBetter: false },
];

export default function CoachManageTestTypesPage() {
  return (
    <div>
      {/* Page header */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        S&C Testing
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Test Types
      </h1>

      <div className="bg-status-amber/10 border border-status-amber/20 rounded-xl px-5 py-3 mb-6 text-sm text-status-amber max-w-2xl">
        These exercises are fixed and match the Member Results page. Contact your developer to add or change exercises.
      </div>

      {/* Main card */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden mb-6 max-w-2xl">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

          {/* Card header */}
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="font-semibold text-text-primary text-sm">Active Test Types ({TEST_TYPES.length})</h2>
          </div>

          {/* List */}
          <ul className="divide-y divide-border-light">
            {TEST_TYPES.map((tt, idx) => (
              <li
                key={tt.name}
                className="flex items-center gap-3 px-5 py-4"
              >
                {/* Order number */}
                <span className="text-xs font-semibold text-text-muted w-5 shrink-0 text-center">{idx + 1}</span>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary text-sm">{tt.name}</span>

                    {/* Unit badge */}
                    <span className="text-[11px] font-data font-semibold px-2 py-0.5 rounded-full bg-bg-main border border-border-light text-text-secondary">
                      {tt.unit}
                    </span>

                    {/* Higher/lower badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        tt.higherIsBetter
                          ? "bg-status-green/10 text-status-green"
                          : "bg-status-amber/10 text-status-amber"
                      }`}
                    >
                      {tt.higherIsBetter ? "↑ Higher better" : "↓ Lower better"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
