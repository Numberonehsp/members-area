"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AwardType = "athlete" | "commitment" | "achievement";
type ChallengeType = "attendance" | "education" | "custom";

// ─── Constants ───────────────────────────────────────────────────────────────

const AWARD_TILES: { type: AwardType; emoji: string; label: string }[] = [
  { type: "athlete", emoji: "🏆", label: "Athlete of the Month" },
  { type: "commitment", emoji: "🔥", label: "Commitment Club" },
  { type: "achievement", emoji: "⭐", label: "Achievement" },
];

const MEMBERS = [
  "Alex Johnson",
  "Sam Davies",
  "Jordan Williams",
  "Casey Roberts",
  "Morgan Evans",
  "Priya Sharma",
  "Tom Hughes",
];

const MONTHS = [
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
];

const SEED_CHALLENGES = [
  { id: "1", title: "April Attendance Challenge", joined: 9 },
  { id: "2", title: "Nutrition Pathway Sprint", joined: 4 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoTitle(type: AwardType | "", month: string): string {
  if (!type || !month) return "";
  const labels: Record<AwardType, string> = {
    athlete: "Athlete of the Month",
    commitment: "Commitment Club",
    achievement: "Achievement",
  };
  return `${labels[type]} — ${month}`;
}

// ─── Give Award Section ───────────────────────────────────────────────────────

function GiveAwardSection() {
  const [awardType, setAwardType] = useState<AwardType | "">("");
  const [member, setMember] = useState("");
  const [month, setMonth] = useState(MONTHS[0]);
  const [title, setTitle] = useState(autoTitle("", MONTHS[0]));
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [success, setSuccess] = useState(false);

  function handleTypeSelect(type: AwardType) {
    setAwardType(type);
    setTitle(autoTitle(type, month));
  }

  function handleMonthChange(m: string) {
    setMonth(m);
    if (awardType) setTitle(autoTitle(awardType, m));
  }

  function handleSubmit() {
    if (!awardType || !member) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAwardType("");
      setMember("");
      setMonth(MONTHS[0]);
      setTitle("");
      setBody("");
      setPublished(true);
    }, 3000);
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm mb-6">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <h2 className="font-semibold text-text-primary mb-4">🏆 Give Award</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Award published! ✓
        </div>
      )}

      {/* Award type tiles */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {AWARD_TILES.map((tile) => (
          <button
            key={tile.type}
            onClick={() => handleTypeSelect(tile.type)}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-center transition-colors ${
              awardType === tile.type
                ? "border-brand bg-brand/10 text-brand"
                : "border-border-light bg-bg-main text-text-secondary hover:border-brand/40 hover:text-text-primary"
            }`}
          >
            <span className="text-2xl">{tile.emoji}</span>
            <span className="text-xs font-semibold leading-tight px-1">{tile.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Member */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Member</label>
          <select
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors"
          >
            <option value="">Select member…</option>
            {MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Award title"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Message / Quote
        </label>
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a short message or motivational quote for this member…"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <button
            role="switch"
            aria-checked={published}
            onClick={() => setPublished((p) => !p)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              published ? "bg-brand" : "bg-border-light"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                published ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          Published
        </label>
        <button
          onClick={handleSubmit}
          disabled={!awardType || !member}
          className="bg-brand text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Give Award
        </button>
      </div>
    </div>
  );
}

// ─── Create Challenge Section ─────────────────────────────────────────────────

function CreateChallengeSection() {
  const [challengeTitle, setChallengeTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("attendance");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [success, setSuccess] = useState(false);
  const [deactivated, setDeactivated] = useState<Set<string>>(new Set());

  const TYPE_PILLS: { key: ChallengeType; label: string }[] = [
    { key: "attendance", label: "Attendance" },
    { key: "education", label: "Education" },
    { key: "custom", label: "Custom" },
  ];

  function handleSubmit() {
    if (!challengeTitle) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setChallengeTitle("");
      setDescription("");
      setType("attendance");
      setTarget("");
      setUnit("");
      setStartDate("");
      setEndDate("");
      setActive(true);
    }, 3000);
  }

  function handleDeactivate(id: string) {
    setDeactivated((prev) => new Set([...prev, id]));
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <h2 className="font-semibold text-text-primary mb-4">🏅 Create Challenge</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Challenge created! ✓
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
        <input
          type="text"
          value={challengeTitle}
          onChange={(e) => setChallengeTitle(e.target.value)}
          placeholder="e.g. May Attendance Challenge"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the challenge goal…"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
        />
      </div>

      {/* Type pills */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-2">Type</label>
        <div className="flex gap-2">
          {TYPE_PILLS.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setType(pill.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                type === pill.key
                  ? "bg-brand/10 border-brand/40 text-brand"
                  : "bg-bg-main border-border-light text-text-secondary hover:border-brand/40"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target + Unit */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Target</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="16"
            min="1"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="visits"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors font-data"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors font-data"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <button
            role="switch"
            aria-checked={active}
            onClick={() => setActive((a) => !a)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              active ? "bg-brand" : "bg-border-light"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          Active
        </label>
        <button
          onClick={handleSubmit}
          disabled={!challengeTitle}
          className="bg-brand text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create Challenge
        </button>
      </div>

      {/* Active Challenges list */}
      <div className="border-t border-border-light pt-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Active Challenges
        </h3>
        <div className="space-y-2">
          {SEED_CHALLENGES.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-main border border-border-light ${
                deactivated.has(c.id) ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${deactivated.has(c.id) ? "text-text-secondary line-through" : "text-text-primary"}`}>
                  {c.title}
                </p>
                <p className="text-[11px] text-text-secondary font-data">{c.joined} joined</p>
              </div>
              <button
                onClick={() => handleDeactivate(c.id)}
                disabled={deactivated.has(c.id)}
                className="text-xs text-text-secondary border border-border-light px-2.5 py-1 rounded-lg hover:border-status-red/40 hover:text-status-red transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deactivated.has(c.id) ? "Deactivated" : "Deactivate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Announcements Section ────────────────────────────────────────────────────

function AnnouncementsSection() {
  const [annTitle, setAnnTitle] = useState("");
  const [details, setDetails] = useState("");
  const [pinned, setPinned] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (!annTitle) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAnnTitle("");
      setDetails("");
      setPinned(false);
    }, 3000);
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <h2 className="font-semibold text-text-primary mb-4">📌 Post Announcement</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Announcement posted! ✓
        </div>
      )}

      <p className="text-text-secondary text-sm mb-4">
        Post notices to the member dashboard — gym closures, program changes, events. Members see
        these immediately.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
          <input
            type="text"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="e.g. Gym closed Bank Holiday Monday"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Details (optional)
          </label>
          <textarea
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details for members…"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded accent-brand"
            />
            Pin as high priority
          </label>
          <button
            onClick={handleSubmit}
            disabled={!annTitle}
            className="ml-auto bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Post Announcement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachCommunityPage() {
  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Coach
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Community
        <br />
        <span className="text-brand">Manager</span>
      </h1>

      {/* Section 1 — Give Award (full width) */}
      <GiveAwardSection />

      {/* Sections 2 + 3 — Challenges + Announcements (2-col grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreateChallengeSection />
        <AnnouncementsSection />
      </div>
    </div>
  );
}
