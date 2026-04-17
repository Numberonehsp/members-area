"use client";

import { useState } from "react";
import Link from "next/link";
import BirthdayWidget from "@/components/coach/BirthdayWidget";

type EngagementStatus = "engaged" | "at_risk" | "disengaged";

function getEngagementStatus(
  lastVisitDaysAgo: number,
  lastLoginDaysAgo: number
): EngagementStatus {
  if (lastVisitDaysAgo > 21) return "disengaged";
  if (lastVisitDaysAgo > 7 || lastLoginDaysAgo > 30) return "at_risk";
  return "engaged";
}

const STATUS_CONFIG = {
  engaged: {
    dot: "bg-status-green",
    label: "Engaged",
    text: "text-status-green",
    bg: "bg-status-green/10",
    border: "border-status-green/20",
  },
  at_risk: {
    dot: "bg-status-amber",
    label: "At Risk",
    text: "text-status-amber",
    bg: "bg-status-amber/10",
    border: "border-status-amber/20",
  },
  disengaged: {
    dot: "bg-status-red",
    label: "Disengaged",
    text: "text-status-red",
    bg: "bg-status-red/10",
    border: "border-status-red/20",
  },
};

const SAMPLE_MEMBERS = [
  { id: "1", name: "Alex Johnson", lastVisit: 2, lastLogin: 1, visitsMonth: 8, educationPct: 60, lastScan: "3 Apr" },
  { id: "2", name: "Sam Davies", lastVisit: 5, lastLogin: 3, visitsMonth: 6, educationPct: 40, lastScan: "1 Mar" },
  { id: "3", name: "Jordan Williams", lastVisit: 12, lastLogin: 8, visitsMonth: 3, educationPct: 20, lastScan: "—" },
  { id: "4", name: "Casey Roberts", lastVisit: 25, lastLogin: 30, visitsMonth: 1, educationPct: 10, lastScan: "12 Feb" },
  { id: "5", name: "Morgan Evans", lastVisit: 1, lastLogin: 1, visitsMonth: 10, educationPct: 80, lastScan: "3 Apr" },
  { id: "6", name: "Priya Sharma", lastVisit: 3, lastLogin: 2, visitsMonth: 9, educationPct: 70, lastScan: "3 Apr" },
  { id: "7", name: "Tom Hughes", lastVisit: 18, lastLogin: 20, visitsMonth: 2, educationPct: 30, lastScan: "—" },
];

type SortKey = "name" | "lastVisit" | "visitsMonth" | "educationPct" | "status";

export default function CoachDashboardPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | "all">("all");

  const statusCounts = SAMPLE_MEMBERS.reduce(
    (acc, m) => {
      const s = getEngagementStatus(m.lastVisit, m.lastLogin);
      acc[s]++;
      return acc;
    },
    { engaged: 0, at_risk: 0, disengaged: 0 }
  );

  const filtered = SAMPLE_MEMBERS
    .filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const status = getEngagementStatus(m.lastVisit, m.lastLogin);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortKey === "status") {
        const order = { engaged: 0, at_risk: 1, disengaged: 2 };
        valA = order[getEngagementStatus(a.lastVisit, a.lastLogin)];
        valB = order[getEngagementStatus(b.lastVisit, b.lastLogin)];
      } else if (sortKey === "name") {
        valA = a.name;
        valB = b.name;
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-30">↕</span>;
    return <span className="text-brand">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">
        Coach
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Dashboard
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Members", value: SAMPLE_MEMBERS.length, sub: "active", colour: "", onClick: () => setStatusFilter("all") },
          { label: "Engaged", value: statusCounts.engaged, sub: "last 7 days", colour: "text-status-green", onClick: () => setStatusFilter("engaged") },
          { label: "At Risk", value: statusCounts.at_risk, sub: "8–21 days", colour: "text-status-amber", onClick: () => setStatusFilter("at_risk") },
          { label: "Disengaged", value: statusCounts.disengaged, sub: "21+ days", colour: "text-status-red", onClick: () => setStatusFilter("disengaged") },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden text-left hover:border-brand/40 transition-colors cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <p className={`font-display text-4xl leading-none mb-1 ${stat.colour || "text-text-primary"}`}>
              {stat.value}
            </p>
            <p className="text-xs font-semibold text-text-primary">{stat.label}</p>
            <p className="text-[11px] text-text-secondary">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Two column: table + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Member engagement table */}
        <div className="lg:col-span-2 bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="font-semibold text-text-primary text-sm mb-2">Member Engagement</h2>
                <input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm bg-bg-main border border-border-light rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium shrink-0 ${STATUS_CONFIG[statusFilter].bg} ${STATUS_CONFIG[statusFilter].text} ${STATUS_CONFIG[statusFilter].border}`}
                >
                  {STATUS_CONFIG[statusFilter].label} ×
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-bg-main/50">
                  {([
                    { key: "name", label: "Member" },
                    { key: "lastVisit", label: "Last Visit" },
                    { key: "visitsMonth", label: "Visits" },
                    { key: "educationPct", label: "Education" },
                    { key: "status", label: "Status" },
                  ] as { key: SortKey; label: string }[]).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand transition-colors select-none"
                    >
                      {col.label} <SortIcon col={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filtered.map((member) => {
                    const status = getEngagementStatus(member.lastVisit, member.lastLogin);
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <tr key={member.id} className="hover:bg-bg-main/60 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/coach/members/${member.id}`}
                            className="font-medium text-text-primary hover:text-brand transition-colors"
                          >
                            {member.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-data text-text-secondary text-xs">
                          {member.lastVisit === 0 ? "Today" : member.lastVisit === 1 ? "Yesterday" : `${member.lastVisit}d ago`}
                        </td>
                        <td className="px-4 py-3 font-data text-text-primary font-semibold">
                          {member.visitsMonth}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-border-light rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${member.educationPct}%` }} />
                            </div>
                            <span className="font-data text-xs text-text-secondary">{member.educationPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border-light flex items-center justify-between">
            <span className="text-xs text-text-secondary">{filtered.length} of {SAMPLE_MEMBERS.length} members</span>
            <Link href="/coach/members" className="text-xs text-brand hover:text-brand-dark transition-colors font-medium">
              View all →
            </Link>
          </div>
        </div>

        {/* Right sidebar: birthdays + quick actions */}
        <div className="space-y-4">
          <BirthdayWidget />

          {/* Quick Actions */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Input InBody Scan", href: "/coach/input/inbody", emoji: "⚖️" },
                { label: "Input Testing Results", href: "/coach/input/testing", emoji: "🏋️" },
                { label: "Give Award", href: "/coach/community", emoji: "🌟" },
                { label: "Post Announcement", href: "/coach/community", emoji: "📌" },
                { label: "Manage Partners", href: "/coach/partners", emoji: "🤝" },
              ].map(({ label, href, emoji }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2 bg-bg-main border border-border-light text-text-primary text-xs font-medium px-3 py-2 rounded-xl hover:border-brand hover:text-brand transition-colors"
                >
                  <span>{emoji}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
