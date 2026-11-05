"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BodyFigure from "./BodyFigure";
import PrivacyNotice from "@/components/wellbeing/PrivacyNotice";
import { areasWords, type InjuryRow, type InjuryStatus } from "@/lib/injury/rules";
import { regionLabel } from "@/lib/injury/regions";

const STATUS_WORDS: Record<InjuryStatus, string> = { current: "Current", recovering: "Recovering", resolved: "Resolved" };
const today = () => new Date().toISOString().slice(0, 10);
const ukDate = (iso: string) => iso.split("-").reverse().join("/");

export default function InjuryReport() {
  const [injuries, setInjuries] = useState<InjuryRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [areas, setAreas] = useState<string[]>([]);
  const [injuredOn, setInjuredOn] = useState(today());
  const [pain, setPain] = useState<number | null>(null);
  const [status, setStatus] = useState<"current" | "recovering">("current");
  const [seen, setSeen] = useState<boolean | null>(null);
  const [therapistNote, setTherapistNote] = useState("");
  const [notes, setNotes] = useState("");
  const [wants, setWants] = useState(false);
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/injury", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setInjuries(((await res.json()) as { injuries: InjuryRow[] }).injuries);
    } catch {
      setInjuries([]);
      setError("We could not load your injury reports. Please refresh.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) => setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.length >= 8 ? a : [...a, id]));

  const ready = areas.length > 0 && pain !== null && seen !== null && consent;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/injury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas, injuredOn, pain, status, seenTherapist: seen, therapistNote, notes, wantsTherapistInfo: wants, consent }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setAreas([]);
      setPain(null);
      setSeen(null);
      setTherapistNote("");
      setNotes("");
      setWants(false);
      setConsent(false);
      setAdding(false);
      setDone(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatusFor(id: string, next: InjuryStatus) {
    setError(null);
    const res = await fetch(`/api/injury/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) setError("We could not update that. Please try again.");
    await load();
  }

  const chip = (on: boolean) =>
    `min-h-11 px-4 rounded-xl border text-sm font-medium ${on ? "bg-brand text-white border-brand" : "bg-bg-card text-text-primary border-border-light"}`;

  return (
    <div className="max-w-2xl">
      <Link href="/wellbeing" className="text-xs text-text-secondary hover:text-brand">← Wellbeing</Link>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand font-semibold mt-3 mb-1">Wellbeing</p>
      <h1 className="font-display text-4xl text-text-primary leading-[0.95] mb-2">Report an injury</h1>
      <p className="text-sm text-text-secondary mb-5">Tell your coaches about an injury so they can adjust your sessions and talk it through with you.</p>

      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}
      {done && !adding && <p role="status" className="text-sm text-text-primary bg-bg-card border border-brand/30 rounded-xl px-4 py-3 mb-4">Thanks, your coaches have been told.</p>}

      {injuries && injuries.length > 0 && (
        <section className="space-y-3 mb-6" aria-label="Your injury reports">
          {injuries.map((i) => (
            <div key={i.id} className="bg-bg-card border border-border-light rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{areasWords(i.areas)}</p>
                <span className="text-xs font-medium text-brand shrink-0">{STATUS_WORDS[i.status]}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {ukDate(i.injured_on)} · Pain {i.pain}/10{i.seen_therapist ? " · Seen a physio or therapist" : ""}
              </p>
              {i.notes && <p className="text-sm text-text-primary mt-2">{i.notes}</p>}
              {i.status !== "resolved" && (
                <div className="flex gap-2 mt-3">
                  {i.status === "current" && (
                    <button type="button" onClick={() => setStatusFor(i.id, "recovering")} className="min-h-11 px-3 rounded-lg border border-border-light text-xs font-medium text-text-primary">
                      Mark as recovering
                    </button>
                  )}
                  <button type="button" onClick={() => setStatusFor(i.id, "resolved")} className="min-h-11 px-3 rounded-lg border border-border-light text-xs font-medium text-text-primary">
                    Mark as resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {!adding ? (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setDone(false);
          }}
          className="min-h-12 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold"
        >
          {injuries && injuries.length > 0 ? "Report another injury" : "Report an injury"}
        </button>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-1">1. Where does it hurt?</h2>
            <p className="text-xs text-text-secondary mb-2">Tap the area on the front or back. Left and right are your own left and right.</p>
            <BodyFigure selected={areas} onToggle={toggle} />
            <p className="text-sm text-text-primary mt-2" aria-live="polite">
              {areas.length === 0 ? "Nothing selected yet." : `Selected: ${areas.map(regionLabel).join(", ")}`}
            </p>
          </section>

          <section>
            <label htmlFor="injured-on" className="text-sm font-semibold text-text-primary block mb-1">2. When did it happen?</label>
            <input id="injured-on" type="date" max={today()} value={injuredOn} onChange={(e) => setInjuredOn(e.target.value)} className="min-h-11 px-3 rounded-xl border border-border-light bg-bg-card text-sm" />
            <p className="text-xs text-text-secondary mt-1">An approximate date is fine.</p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-1">3. How sore is it right now?</h2>
            <p className="text-xs text-text-secondary mb-2">0 is no pain, 10 is the worst pain you can imagine.</p>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-2" role="radiogroup" aria-label="Pain level">
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} type="button" role="radio" aria-checked={pain === n} onClick={() => setPain(n)} className={chip(pain === n)}>
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-2">4. How is it now?</h2>
            <div className="flex gap-2" role="radiogroup" aria-label="Status">
              <button type="button" role="radio" aria-checked={status === "current"} onClick={() => setStatus("current")} className={chip(status === "current")}>Still sore</button>
              <button type="button" role="radio" aria-checked={status === "recovering"} onClick={() => setStatus("recovering")} className={chip(status === "recovering")}>Getting better</button>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-2">5. Have you seen a physio or sports therapist about it?</h2>
            <div className="flex gap-2" role="radiogroup" aria-label="Seen a therapist">
              <button type="button" role="radio" aria-checked={seen === true} onClick={() => setSeen(true)} className={chip(seen === true)}>Yes</button>
              <button type="button" role="radio" aria-checked={seen === false} onClick={() => setSeen(false)} className={chip(seen === false)}>No</button>
            </div>
            {seen === true && (
              <input
                type="text"
                maxLength={200}
                value={therapistNote}
                onChange={(e) => setTherapistNote(e.target.value)}
                placeholder="Who, and what they advised (optional)"
                aria-label="Therapist details"
                className="mt-3 w-full min-h-11 px-3 rounded-xl border border-border-light bg-bg-card text-sm"
              />
            )}
          </section>

          <section>
            <label htmlFor="injury-notes" className="text-sm font-semibold text-text-primary block mb-1">6. Anything else we should know? (optional)</label>
            <textarea id="injury-notes" rows={4} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How it happened, what makes it worse, movements to avoid" className="w-full px-3 py-2 rounded-xl border border-border-light bg-bg-card text-sm" />
          </section>

          <label className="flex items-start gap-3 text-sm text-text-primary">
            <input type="checkbox" checked={wants} onChange={(e) => setWants(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>I would like the team to tell me about physio and sports therapy services.</span>
          </label>

          <PrivacyNotice what="your injury report" />
          <label className="flex items-start gap-3 text-sm text-text-primary">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>I am happy for Number One HSP to store this health information and share it with my coaches.</span>
          </label>

          <div className="flex gap-3">
            <button type="button" disabled={busy || !ready} onClick={submit} className="min-h-12 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "Sending…" : "Send to my coaches"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="min-h-12 px-5 rounded-xl border border-border-light text-sm text-text-primary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
