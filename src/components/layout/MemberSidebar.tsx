"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/layout/NotificationBell";
import LogoutButton from "@/components/layout/LogoutButton";
import { MEMBER_NAV_ITEMS, isNavItemActive } from "@/components/layout/navItems";

const SIDEBAR_ICONS: Record<
  string,
  (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
> = {
  "/dashboard": HomeIcon,
  "/education": BookIcon,
  "/results": ChartIcon,
  "/community": UsersIcon,
};

export default function MemberSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-bg-sidebar text-text-on-dark flex-col z-40">
      <div className="bg-facets px-6 pt-7 pb-5 border-b border-white/10 relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[9px] tracking-[0.4em] uppercase text-brand-light mb-2">
              Health · Strength · Performance
            </p>
            <h1 className="font-display text-3xl leading-none text-text-on-dark">
              Members<br />
              <span className="text-brand">Area</span>
            </h1>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 py-3">
        {MEMBER_NAV_ITEMS.map((item) => {
          const Icon = SIDEBAR_ICONS[item.href];
          const isActive = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-all ${
                isActive
                  ? "bg-brand/10 text-brand border-r-2 border-brand font-semibold"
                  : "text-text-on-dark/60 hover:text-text-on-dark hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 text-sm text-text-on-dark/70 hover:text-text-on-dark"
        >
          <UserIcon className="w-5 h-5" />
          Profile
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}

/* Inline icon set — keeps the layout shell dependency-free */
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
      <path d="M4 16a4 4 0 0 1 4-4h12" />
    </svg>
  );
}
function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
