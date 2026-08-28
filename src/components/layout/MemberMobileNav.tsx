"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MEMBER_NAV_ITEMS, isNavItemActive } from "@/components/layout/navItems";

const TAB_EMOJI = {
  "/dashboard": "🏠",
  "/education": "📚",
  "/results": "📊",
  "/community": "🏆",
} satisfies Record<(typeof MEMBER_NAV_ITEMS)[number]["href"], string>;

export default function MemberMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar text-text-on-dark border-t border-white/10 z-40 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-around items-stretch h-16">
        {MEMBER_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand" : "text-text-on-dark/70"
                }`}
              >
                <span className="text-lg leading-none">{TAB_EMOJI[item.href]}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
