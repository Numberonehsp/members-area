"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | "message"
  | "award"
  | "challenge"
  | "result"
  | "announcement";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  href: string;
}

type FilterKey = "all" | "unread" | "message" | "award" | "challenge";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; colour: string; bgColour: string; borderColour: string; label: string }
> = {
  message:      { icon: "💬", colour: "text-brand",          bgColour: "bg-brand/10",          borderColour: "border-brand/20",         label: "Message"      },
  award:        { icon: "🏆", colour: "text-status-amber",   bgColour: "bg-status-amber/10",   borderColour: "border-status-amber/20",  label: "Award"        },
  challenge:    { icon: "🎯", colour: "text-brand",          bgColour: "bg-brand/10",          borderColour: "border-brand/20",         label: "Challenge"    },
  result:       { icon: "📊", colour: "text-status-green",   bgColour: "bg-status-green/10",   borderColour: "border-status-green/20",  label: "Result"       },
  announcement: { icon: "📌", colour: "text-text-secondary", bgColour: "bg-white/5",           borderColour: "border-border-light",     label: "Announcement" },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All"        },
  { key: "unread",    label: "Unread"     },
  { key: "message",   label: "Messages"   },
  { key: "award",     label: "Awards"     },
  { key: "challenge", label: "Challenges" },
];

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "message",
    title: "New message from coaching team",
    body: "Hey Ed, great session on Tuesday! Your deadlift form is really coming together.",
    createdAt: "2026-04-09T09:00:00Z",
    isRead: false,
    href: "/messages",
  },
  {
    id: "n2",
    type: "award",
    title: "You've been awarded Commitment Club!",
    body: "16 visits in March — brilliant consistency. Keep it up!",
    createdAt: "2026-04-08T14:00:00Z",
    isRead: false,
    href: "/community/awards",
  },
  {
    id: "n3",
    type: "challenge",
    title: "April Attendance Challenge — 7 days left",
    body: "You're at 9/16 visits. You can do it!",
    createdAt: "2026-04-07T10:00:00Z",
    isRead: false,
    href: "/community/challenge/1",
  },
  {
    id: "n4",
    type: "result",
    title: "New InBody scan recorded",
    body: "Your latest body composition results are now available.",
    createdAt: "2026-04-03T11:00:00Z",
    isRead: true,
    href: "/results/body-composition",
  },
  {
    id: "n5",
    type: "announcement",
    title: "Testing week starts Monday",
    body: "Back Squat, Deadlift, 500m Row and Pull-Up. Book your slot.",
    createdAt: "2026-04-01T09:00:00Z",
    isRead: true,
    href: "/dashboard",
  },
  {
    id: "n6",
    type: "challenge",
    title: "You joined the April Attendance Challenge",
    body: "Good luck! You're competing with 12 other members.",
    createdAt: "2026-04-01T08:00:00Z",
    isRead: true,
    href: "/community/challenge/1",
  },
  {
    id: "n7",
    type: "announcement",
    title: "Gym closed Good Friday & Easter Monday",
    body: "Friday 18th and Monday 21st April — plan accordingly.",
    createdAt: "2026-03-28T09:00:00Z",
    isRead: true,
    href: "/dashboard",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function applyFilter(notifications: Notification[], filter: FilterKey): Notification[] {
  switch (filter) {
    case "unread":    return notifications.filter((n) => !n.isRead);
    case "message":   return notifications.filter((n) => n.type === "message");
    case "award":     return notifications.filter((n) => n.type === "award");
    case "challenge": return notifications.filter((n) => n.type === "challenge");
    default:          return notifications;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(SEED_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const filtered = applyFilter(notifications, activeFilter);

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-data mb-1">
            Activity
          </p>
          <h1 className="font-display text-4xl text-text-primary leading-none">
            Notifications
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="mt-1 flex-shrink-0 text-sm text-brand hover:text-brand/80 border border-brand/30 hover:border-brand/50 rounded-xl px-4 py-2 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`text-sm rounded-xl px-4 py-1.5 border transition-colors ${
                isActive
                  ? "bg-brand text-white border-brand font-medium"
                  : "bg-bg-card border-border-light text-text-secondary hover:text-text-primary hover:border-brand/30"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="bg-bg-card border border-border-light rounded-2xl px-6 py-12 text-center">
          <p className="text-text-secondary text-sm">No notifications here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors hover:border-brand/30 ${
                    !n.isRead
                      ? "bg-bg-card border-border-light"
                      : "bg-bg-card border-border-light opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon bubble */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bgColour} ${cfg.borderColour}`}
                    >
                      <span className="text-lg leading-none">{cfg.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] tracking-widest uppercase font-data font-medium ${cfg.colour}`}
                        >
                          {cfg.label}
                        </span>
                        {!n.isRead && (
                          <span
                            aria-label="Unread"
                            className="w-2 h-2 rounded-full bg-brand flex-shrink-0"
                          />
                        )}
                      </div>

                      <p className="text-sm font-medium text-text-primary leading-snug">
                        {n.title}
                      </p>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-xs text-text-secondary/60 font-data mt-2">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer note */}
      <p className="mt-8 text-xs text-text-secondary/60 border-t border-border-light pt-6">
        Email notifications coming soon — you&apos;ll be notified by email for new messages and awards.
      </p>
    </div>
  );
}
