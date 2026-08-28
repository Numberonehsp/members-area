"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "message"
  | "award"
  | "challenge"
  | "result"
  | "announcement";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  href: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; colour: string; label: string }
> = {
  message:      { icon: "💬", colour: "text-brand",           label: "New Message"   },
  award:        { icon: "🏆", colour: "text-status-amber",    label: "Award"         },
  challenge:    { icon: "🎯", colour: "text-brand",           label: "Challenge"     },
  result:       { icon: "📊", colour: "text-status-green",    label: "Result"        },
  announcement: { icon: "📌", colour: "text-text-secondary",  label: "Announcement"  },
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_NOTIFICATIONS: Notification[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return "Yesterday";

  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Bell SVG
// ---------------------------------------------------------------------------

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationBell({
  align = "left",
}: { align?: "left" | "right" } = {}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(SEED_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  function handleNotificationClick(n: Notification) {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-text-on-dark/70 hover:text-text-on-dark hover:bg-white/10 transition-colors relative"
      >
        <BellIcon className="w-5 h-5" />

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-data font-bold flex items-center justify-center px-0.5 leading-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-11 z-[100] bg-bg-card border border-border-light rounded-2xl shadow-xl w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light sticky top-0 bg-bg-card rounded-t-2xl">
            <span className="text-sm font-display text-text-primary">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand hover:text-brand/80 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-text-secondary">No notifications yet.</p>
            </div>
          )}
          <ul>
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border-light last:border-b-0 hover:bg-white/5 transition-colors ${
                      !n.isRead
                        ? "border-l-2 pl-[14px] bg-white/[0.03]"
                        : ""
                    }`}
                    style={
                      !n.isRead
                        ? {
                            borderLeftColor: `var(--color-${
                              n.type === "award"
                                ? "status-amber"
                                : n.type === "result"
                                ? "status-green"
                                : n.type === "announcement"
                                ? "text-secondary"
                                : "brand"
                            })`,
                          }
                        : undefined
                    }
                  >
                    <span className={`text-lg leading-none mt-0.5 ${cfg.colour}`}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-text-secondary/60 font-data mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border-light sticky bottom-0 bg-bg-card rounded-b-2xl">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand hover:text-brand/80 transition-colors font-medium"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
