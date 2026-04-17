"use client";

import { useState } from "react";

type TestType = {
  id: number;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  active: boolean;
};

const SEED_TEST_TYPES: TestType[] = [
  { id: 1, name: "Back Squat", unit: "kg", higherIsBetter: true, active: true },
  { id: 2, name: "Deadlift", unit: "kg", higherIsBetter: true, active: true },
  { id: 3, name: "Strict Press", unit: "kg", higherIsBetter: true, active: true },
  { id: 4, name: "500m Row", unit: "seconds", higherIsBetter: false, active: true },
  { id: 5, name: "Pull-Up Max", unit: "reps", higherIsBetter: true, active: true },
  { id: 6, name: "1RM Bench Press", unit: "kg", higherIsBetter: true, active: true },
];

type ModalState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; testType: TestType };

export default function CoachManageTestTypesPage() {
  const [testTypes, setTestTypes] = useState<TestType[]>(SEED_TEST_TYPES);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [savedFlash, setSavedFlash] = useState<number | null>(null);

  // Modal form state
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formHigher, setFormHigher] = useState(true);

  function openAdd() {
    setFormName("");
    setFormUnit("");
    setFormHigher(true);
    setModal({ mode: "add" });
  }

  function openEdit(tt: TestType) {
    setFormName(tt.name);
    setFormUnit(tt.unit);
    setFormHigher(tt.higherIsBetter);
    setModal({ mode: "edit", testType: tt });
  }

  function closeModal() {
    setModal({ mode: "closed" });
  }

  function flashSaved(id: number) {
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(null), 1800);
  }

  function handleModalSave() {
    if (!formName.trim() || !formUnit.trim()) return;
    if (modal.mode === "add") {
      const newId = Math.max(0, ...testTypes.map((t) => t.id)) + 1;
      const newItem: TestType = {
        id: newId,
        name: formName.trim(),
        unit: formUnit.trim(),
        higherIsBetter: formHigher,
        active: true,
      };
      setTestTypes((prev) => [...prev, newItem]);
      flashSaved(newId);
    } else if (modal.mode === "edit") {
      setTestTypes((prev) =>
        prev.map((t) =>
          t.id === modal.testType.id
            ? { ...t, name: formName.trim(), unit: formUnit.trim(), higherIsBetter: formHigher }
            : t
        )
      );
      flashSaved(modal.testType.id);
    }
    closeModal();
  }

  function toggleActive(id: number) {
    setTestTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  }

  function move(id: number, dir: -1 | 1) {
    setTestTypes((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  const inputClass =
    "w-full bg-bg-main border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors";

  const labelClass = "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5";

  return (
    <div>
      {/* Page header */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        S&C Testing
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Manage Test Types
      </h1>

      {/* Main card */}
      <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

          {/* Card header */}
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
            <h2 className="font-semibold text-text-primary text-sm">Test Types</h2>
            <button
              onClick={openAdd}
              className="bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              + Add Test Type
            </button>
          </div>

          {/* List */}
          <ul className="divide-y divide-border-light">
            {testTypes.map((tt, idx) => (
              <li
                key={tt.id}
                className={`flex items-center gap-3 px-5 py-4 transition-colors ${
                  tt.active ? "hover:bg-bg-main/60" : "opacity-50 hover:bg-bg-main/40"
                }`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(tt.id, -1)}
                    disabled={idx === 0}
                    className="text-text-secondary hover:text-brand disabled:opacity-20 text-xs leading-none px-1 py-0.5 transition-colors"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(tt.id, 1)}
                    disabled={idx === testTypes.length - 1}
                    className="text-text-secondary hover:text-brand disabled:opacity-20 text-xs leading-none px-1 py-0.5 transition-colors"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

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

                    {/* Inactive badge */}
                    {!tt.active && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-red/10 text-status-red">
                        Inactive
                      </span>
                    )}

                    {/* Saved flash */}
                    {savedFlash === tt.id && (
                      <span className="text-[11px] font-semibold text-status-green">
                        ✓ Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(tt)}
                    className="text-xs text-text-secondary hover:text-brand transition-colors font-medium px-2 py-1 rounded-lg hover:bg-bg-main"
                  >
                    Edit
                  </button>

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(tt.id)}
                    title={tt.active ? "Deactivate" : "Activate"}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      tt.active ? "bg-brand" : "bg-border-light"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        tt.active ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-text-secondary text-center">
        Changes will persist to Supabase once wired in Phase 3 backend work.
      </p>

      {/* Modal */}
      {modal.mode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

            <div className="px-6 py-5 border-b border-border-light">
              <h3 className="font-semibold text-text-primary text-base">
                {modal.mode === "add" ? "Add Test Type" : "Edit Test Type"}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Back Squat"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg, reps, seconds"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormHigher(true)}
                    className={`flex-1 text-sm font-medium py-2 rounded-xl border transition-colors ${
                      formHigher
                        ? "bg-status-green/10 border-status-green/30 text-status-green"
                        : "bg-bg-main border-border-light text-text-secondary hover:border-brand"
                    }`}
                  >
                    ↑ Higher is better
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormHigher(false)}
                    className={`flex-1 text-sm font-medium py-2 rounded-xl border transition-colors ${
                      !formHigher
                        ? "bg-status-amber/10 border-status-amber/30 text-status-amber"
                        : "bg-bg-main border-border-light text-text-secondary hover:border-brand"
                    }`}
                  >
                    ↓ Lower is better
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border-light flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={!formName.trim() || !formUnit.trim()}
                className="bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
              >
                {modal.mode === "add" ? "Add" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
