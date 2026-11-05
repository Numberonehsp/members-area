"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CONSENT_TEXT, SECTIONS, type Question } from "@/lib/questionnaire/schema";
import { missingRequired, type AnswerValue, type Answers } from "@/lib/questionnaire/answers";

type State = { draft: { answers: Answers } | null; latest: { answers: Answers; submitted_at: string | null } | null };

const field = "w-full bg-bg-card border border-border-light rounded-xl px-4 py-3 text-base text-text-primary focus:border-brand focus:outline-none";
const chip = (on: boolean) =>
  `min-h-12 px-4 rounded-xl border text-base text-left transition-colors ${on ? "border-brand bg-brand/10 text-text-primary font-semibold" : "border-border-light bg-bg-card text-text-secondary hover:border-brand/40"}`;

function QuestionField({ q, value, onChange, answers }: { q: Question; value: AnswerValue | undefined; onChange: (id: string, v: AnswerValue | null) => void; answers: Answers }) {
  const label = (
    <p className="text-base font-medium text-text-primary mb-2">
      {q.label}
      {q.required && <span className="text-brand"> *</span>}
    </p>
  );
  switch (q.kind) {
    case "text":
      return (
        <label className="block">
          {label}
          {q.hint && <span className="block text-xs text-text-secondary mb-1">{q.hint}</span>}
          {q.short ? (
            <input className={field} value={(value as string) ?? ""} maxLength={120} onChange={(e) => onChange(q.id, e.target.value)} />
          ) : (
            <textarea className={field} rows={3} value={(value as string) ?? ""} maxLength={1000} onChange={(e) => onChange(q.id, e.target.value)} />
          )}
        </label>
      );
    case "yesno":
      return (
        <fieldset>
          <legend className="sr-only">{q.label}</legend>
          {label}
          <div className="flex gap-3">
            {[true, false].map((b) => (
              <button key={String(b)} type="button" aria-pressed={value === b} onClick={() => onChange(q.id, b)} className={chip(value === b) + " flex-1 text-center"}>
                {b ? "Yes" : "No"}
              </button>
            ))}
          </div>
          {value === true && q.detailId && (
            <label className="block mt-3">
              <span className="block text-sm text-text-secondary mb-1">{q.detailLabel}</span>
              <textarea className={field} rows={3} value={(answers[q.detailId] as string) ?? ""} maxLength={1000} onChange={(e) => onChange(q.detailId!, e.target.value)} />
            </label>
          )}
        </fieldset>
      );
    case "scale":
      return (
        <fieldset>
          <legend className="sr-only">{q.label}</legend>
          {label}
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={value === n} aria-label={`${n} out of 10`} onClick={() => onChange(q.id, n)} className={chip(value === n) + " text-center px-0"}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>1 · {q.low}</span>
            <span>10 · {q.high}</span>
          </div>
        </fieldset>
      );
    case "hours":
      return (
        <label className="block">
          {label}
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={168}
            step={0.5}
            className={field}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(q.id, e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
      );
    case "single":
      return (
        <fieldset>
          <legend className="sr-only">{q.label}</legend>
          {label}
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => (
              <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(q.id, o.value)} className={chip(value === o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      );
    case "multi": {
      const list = (value as string[] | undefined) ?? [];
      return (
        <fieldset>
          <legend className="sr-only">{q.label}</legend>
          {label}
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => {
              const on = list.includes(o.value);
              return (
                <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(q.id, on ? list.filter((x) => x !== o.value) : [...list, o.value])} className={chip(on)}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      );
    }
  }
}

export default function QuestionnaireForm() {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/questionnaire")
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as State;
      })
      .then((s) => {
        setState(s);
        // Resume a draft; otherwise start from the last submitted answers so a refresh is quick.
        setAnswers(s.draft?.answers ?? s.latest?.answers ?? {});
      })
      .catch(() => setLoadError("We couldn't load your questions. Please try again in a moment."));
  }, []);

  const total = SECTIONS.length + 1; // plus the consent step
  const section = SECTIONS[step];
  const missingHere = useMemo(() => {
    if (!section) return [];
    const ids = new Set(section.questions.map((q) => q.id));
    return missingRequired(answers).filter((q) => ids.has(q.id));
  }, [answers, section]);

  function change(id: string, v: AnswerValue | null) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (v === null || v === "") delete next[id];
      else next[id] = v;
      return next;
    });
  }

  const save = useCallback(async (a: Answers): Promise<boolean> => {
    const res = await fetch("/api/questionnaire/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: a }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "We couldn't save that. Please try again.");
      return false;
    }
    return true;
  }, []);

  async function next() {
    setError(null);
    if (missingHere.length > 0) {
      setError(`Please answer: ${missingHere[0].label}`);
      return;
    }
    setBusy(true);
    const ok = await save(answers);
    setBusy(false);
    if (ok) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
    }
  }

  async function submit() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/questionnaire/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, consent }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "We couldn't submit that. Please try again.");
      return;
    }
    setDone(true);
  }

  if (loadError) return <p role="alert" className="text-sm text-status-red">{loadError}</p>;
  if (!state) return <p className="text-sm text-text-secondary">Loading…</p>;

  if (done || (state.latest && !state.draft && !editing)) {
    return (
      <div className="max-w-xl space-y-4">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand font-semibold">My health profile</p>
        <h1 className="font-display text-4xl text-text-primary leading-[0.95]">{done ? "Thank you" : "You've told us about yourself"}</h1>
        <p className="text-text-secondary">
          {done ? "Your coaches can now use your answers to tailor your training and support." : "You can update your answers whenever things change."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/wellbeing" className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">Back to Wellbeing</Link>
          {!done && (
            <button type="button" onClick={() => { setEditing(true); setStep(0); }} className="border border-border-light text-text-primary text-sm font-semibold px-4 py-2.5 rounded-xl">
              Update my answers
            </button>
          )}
        </div>
      </div>
    );
  }

  const last = step === SECTIONS.length;
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand font-semibold mb-1">My health profile</p>
        <div className="h-1.5 bg-border-light rounded-full overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="Progress">
          <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">Step {step + 1} of {total}. Your answers are saved as you go.</p>
      </div>

      {last ? (
        <div className="space-y-4">
          <h1 className="font-display text-3xl text-text-primary">Nearly there</h1>
          <label className="flex items-start gap-3 text-sm text-text-primary">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>{CONSENT_TEXT}</span>
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl text-text-primary">{section.title}</h1>
            {section.intro && <p className="text-sm text-text-secondary mt-1">{section.intro}</p>}
          </div>
          {section.questions.map((q) => (
            <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={change} answers={answers} />
          ))}
        </div>
      )}

      <div aria-live="polite">{error && <p className="text-sm text-status-red bg-status-red/10 rounded-xl px-4 py-3">{error}</p>}</div>

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }} className="min-h-12 px-5 rounded-xl border border-border-light text-text-primary text-sm font-semibold">
            Back
          </button>
        )}
        {last ? (
          <button type="button" disabled={busy || !consent} onClick={submit} className="min-h-12 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={next} className="min-h-12 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
