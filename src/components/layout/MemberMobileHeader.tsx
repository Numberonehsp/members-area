"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import LogoutButton from "@/components/layout/LogoutButton";

export default function MemberMobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside pointer-down or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="md:hidden sticky top-0 z-40 bg-bg-sidebar text-text-on-dark border-b border-white/10 pt-[env(safe-area-inset-top)]">
      <div className="h-14 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-lg leading-none">
          Members <span className="text-brand">Area</span>
        </Link>

        <div className="relative flex items-center gap-1" ref={menuRef}>
          <NotificationBell align="right" />

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-2 text-text-on-dark/80 hover:text-text-on-dark"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-bg-card text-text-primary border border-border-light rounded-xl shadow-lg overflow-hidden">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm hover:bg-black/5"
              >
                Profile
              </Link>
              <div className="border-t border-border-light px-4 py-3">
                <LogoutButton className="w-full flex items-center gap-3 text-sm text-text-primary hover:opacity-80 disabled:opacity-50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
