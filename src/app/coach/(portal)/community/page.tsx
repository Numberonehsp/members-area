"use client";

import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AwardType = "athlete" | "commitment" | "achievement";
type ChallengeType = "attendance" | "education" | "custom";
type Member = { id: string; name: string };
type Challenge = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
};

const AWARD_TILES: { type: AwardType; emoji: string; label: string; apiType: string }[] = [
  { type: "athlete",     emoji: "🏆", label: "Athlete of the Month", apiType: "athlete_of_month" },
  { type: "commitment",  emoji: "🔥", label: "Commitment Club",      apiType: "commitment_club"  },
  { type: "achievement", emoji: "⭐", label: "Achievement",          apiType: "achievement"      },
];

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
});

function monthToIsoDate(label: string): string {
  const d = new Date(label);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

// ─── Give Award Section ───────────────────────────────────────────────────────

function GiveAwardSection() {
  const [awardType, setAwardType] = useState<AwardType | "">("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [month, setMonth] = useState(MONTHS[0]);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gymmaster/members")
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, []);

  const filteredMembers = memberSearch.length >= 1
    ? members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).slice(0, 15)
    : [];

  function handleMemberSelect(id: string, name: string) {
    setSelectedMemberId(id);
    setSelectedMemberName(name);
    setMemberSearch(name);
  }

  async function handleSubmit() {
    if (!awardType || !selectedMemberId) return;
    setSaving(true);
    setError(null);

    const tile = AWARD_TILES.find(t => t.type === awardType)!;
    const res = await fetch("/api/coach/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        award_type: tile.apiType,
        member_name: selectedMemberName,
        month: monthToIsoDate(month),
        reason: body.trim() || null,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAwardType("");
        setSelectedMemberId("");
        setSelectedMemberName("");
        setMemberSearch("");
        setMonth(MONTHS[0]);
        setBody("");
      }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save award");
    }
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm mb-6">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <h2 className="font-semibold text-text-primary mb-4">🏆 Give Award</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Award saved and will appear on the member dashboard! ✓
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Award type tiles */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {AWARD_TILES.map(tile => (
          <button key={tile.type} onClick={() => setAwardType(tile.type)}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-center transition-colors ${awardType === tile.type ? "border-brand bg-brand/10 text-brand" : "border-border-light bg-bg-main text-text-secondary hover:border-brand/40 hover:text-text-primary"}`}>
            <span className="text-2xl">{tile.emoji}</span>
            <span className="text-xs font-semibold leading-tight px-1">{tile.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Member search */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Member</label>
          {membersLoading ? (
            <p className="text-sm text-text-secondary">Loading members…</p>
          ) : (
            <>
              <input type="text" value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setSelectedMemberId(""); setSelectedMemberName(""); }}
                placeholder="Search member name…"
                className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors mb-1" />
              {memberSearch.length >= 1 && !selectedMemberId && filteredMembers.length > 0 && (
                <ul className="border border-border-light rounded-xl overflow-hidden divide-y divide-border-light max-h-40 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <li key={m.id}>
                      <button type="button" onClick={() => handleMemberSelect(m.id, m.name)}
                        className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-main transition-colors">
                        {m.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedMemberId && <p className="text-xs text-status-green font-medium">✓ {selectedMemberName}</p>}
            </>
          )}
        </div>
        {/* Month */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Message / Quote</label>
        <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
          placeholder="Write a short message or motivational quote for this member…"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none" />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={!awardType || !selectedMemberId || saving}
          className="bg-brand text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving…" : "Give Award"}
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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    fetch("/api/coach/challenges")
      .then(r => r.json())
      .then(d => setChallenges(d.challenges ?? []))
      .catch(() => {})
      .finally(() => setLoadingChallenges(false));
  }, []);

  const TYPE_PILLS: { key: ChallengeType; label: string }[] = [
    { key: "attendance", label: "Attendance" },
    { key: "education",  label: "Education"  },
    { key: "custom",     label: "Custom"     },
  ];

  async function handleSubmit() {
    if (!challengeTitle.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/coach/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: challengeTitle.trim(),
        description: description.trim() || null,
        type,
        target: target || null,
        unit: unit.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: active,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      // Refresh the challenges list
      const refreshed = await fetch("/api/coach/challenges").then(r => r.json()).catch(() => ({ challenges: [] }));
      setChallenges(refreshed.challenges ?? []);
      setTimeout(() => {
        setSuccess(false);
        setChallengeTitle(""); setDescription(""); setType("attendance");
        setTarget(""); setUnit(""); setStartDate(""); setEndDate(""); setActive(true);
      }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create challenge");
    }
  }

  async function handleDeactivate(id: string) {
    await fetch("/api/coach/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: false }),
    });
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
  }

  const activeChallenges = challenges.filter(c => c.is_active);

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <h2 className="font-semibold text-text-primary mb-1">🏅 Create Challenge</h2>
      <p className="text-xs text-text-secondary mb-4">
        Challenges appear on the Members Area community page where members can sign up and track progress.
      </p>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Challenge created and visible to members! ✓
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
        <input type="text" value={challengeTitle} onChange={e => setChallengeTitle(e.target.value)} placeholder="e.g. May Attendance Challenge"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors" />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the challenge goal…"
          className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none" />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-2">Type</label>
        <div className="flex gap-2">
          {TYPE_PILLS.map(pill => (
            <button key={pill.key} onClick={() => setType(pill.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${type === pill.key ? "bg-brand/10 border-brand/40 text-brand" : "bg-bg-main border-border-light text-text-secondary hover:border-brand/40"}`}>
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Target</label>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="16" min="1"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors font-data" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
          <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="visits"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors font-data" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors font-data" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <button role="switch" aria-checked={active} onClick={() => setActive(a => !a)}
            className={`relative w-9 h-5 rounded-full transition-colors ${active ? "bg-brand" : "bg-border-light"}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          Active (visible to members)
        </label>
        <button onClick={handleSubmit} disabled={!challengeTitle.trim() || saving}
          className="bg-brand text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Creating…" : "Create Challenge"}
        </button>
      </div>

      {/* Active Challenges list */}
      <div className="border-t border-border-light pt-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Active Challenges ({activeChallenges.length})
        </h3>
        {loadingChallenges ? (
          <p className="text-xs text-text-secondary">Loading…</p>
        ) : activeChallenges.length === 0 ? (
          <p className="text-xs text-text-secondary">No active challenges.</p>
        ) : (
          <div className="space-y-2">
            {activeChallenges.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-main border border-border-light">
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.name}</p>
                  {c.end_date && <p className="text-[11px] text-text-secondary font-data">Ends {c.end_date}</p>}
                </div>
                <button onClick={() => handleDeactivate(c.id)}
                  className="text-xs text-text-secondary border border-border-light px-2.5 py-1 rounded-lg hover:border-status-red/40 hover:text-status-red transition-colors">
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Announcements Section ────────────────────────────────────────────────────

function AnnouncementsSection() {
  const [annTitle, setAnnTitle] = useState("");
  const [details, setDetails] = useState("");
  const [pinned, setPinned] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!annTitle.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/coach/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: annTitle.trim(),
        description: details.trim() || null,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : null,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAnnTitle(""); setDetails(""); setPinned(false); setExpiresInDays("7");
      }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post announcement");
    }
  }

  return (
    <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
      <h2 className="font-semibold text-text-primary mb-2">📌 Post Announcement</h2>
      <p className="text-text-secondary text-xs mb-4">
        Announcements appear as a banner on the member dashboard. Staff Hub announcements also show here — both sources are combined.
      </p>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-status-green/10 border border-status-green/20 text-status-green text-sm font-semibold px-4 py-2.5 rounded-xl">
          Announcement live on member dashboard! ✓
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
          <input type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. Gym closed Bank Holiday Monday"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Details <span className="font-normal">(optional)</span></label>
          <textarea rows={2} value={details} onChange={e => setDetails(e.target.value)} placeholder="Additional details for members…"
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Show for</label>
          <select value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)}
            className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand transition-colors">
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">2 weeks</option>
            <option value="30">1 month</option>
            <option value="">Indefinitely</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded accent-brand" />
            Pin as high priority
          </label>
          <button onClick={handleSubmit} disabled={!annTitle.trim() || saving}
            className="ml-auto bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Posting…" : "Post Announcement"}
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
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Community<br /><span className="text-brand">Manager</span>
      </h1>

      <GiveAwardSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreateChallengeSection />
        <AnnouncementsSection />
      </div>
    </div>
  );
}
