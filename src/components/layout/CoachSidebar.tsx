"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/coach",                       label: "Dashboard"        },
  { href: "/coach/members",               label: "Members"          },
  { href: "/coach/commitment-club",       label: "Commitment Club"  },
  { href: "/coach/messages",              label: "Messages"         },
  { href: "/coach/input/inbody",          label: "InBody Input"     },
  { href: "/coach/input/testing",         label: "S&C Testing"      },
  { href: "/coach/input/testing/manage",  label: "Manage Tests"     },
  { href: "/coach/content",               label: "Content"          },
  { href: "/coach/community",             label: "Community"        },
  { href: "/coach/partners",              label: "Partners"         },
  { href: "/coach/reports",               label: "Reports"          },
];

export default function CoachSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-bg-sidebar text-text-on-dark flex-col z-40">
      <div className="bg-facets px-6 pt-7 pb-5 border-b border-white/10 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
        <p className="relative text-[9px] tracking-[0.4em] uppercase text-brand-light mb-2">
          Health · Strength · Performance
        </p>
        <h1 className="relative font-display text-3xl leading-none text-text-on-dark">
          Coach<br />
          <span className="text-brand">Portal</span>
        </h1>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/coach"
              ? pathname === "/coach"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`block px-6 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-brand/10 text-brand border-r-2 border-brand font-semibold"
                  : "text-text-on-dark/60 hover:text-text-on-dark hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-text-on-dark/40">
        Signed in as Coach
      </div>
    </aside>
  );
}
