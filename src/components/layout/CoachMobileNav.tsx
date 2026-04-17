"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/coach", label: "Dashboard", icon: "🏠" },
  { href: "/coach/members", label: "Members", icon: "👥" },
  { href: "/coach/input/inbody", label: "Input", icon: "📝" },
  { href: "/coach/content", label: "Content", icon: "📚" },
  { href: "/coach/messages", label: "Messages", icon: "💬" },
];

export default function CoachMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar text-text-on-dark border-t border-white/10 z-40 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-around items-stretch h-16">
        {tabs.map(({ href, label, icon }) => {
          const isActive =
            href === "/coach"
              ? pathname === "/coach"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand" : "text-text-on-dark/70"
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
