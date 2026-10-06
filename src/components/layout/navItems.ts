export type MemberNavItem = {
  /** Primary route for the nav item. */
  href: string;
  label: string;
  /** Extra path prefixes this item "owns" for active-state highlighting. */
  match: readonly string[];
};

/** The four member-area destinations, shared by the sidebar and the mobile nav. */
export const MEMBER_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", match: [] },
  { href: "/education", label: "Learn", match: [] },
  {
    href: "/results",
    label: "Tracking",
    match: ["/goals", "/nutrition", "/wellbeing", "/messages"],
  },
  {
    href: "/community",
    label: "Community",
    match: ["/partners", "/commitment-club"],
  },
] as const satisfies readonly MemberNavItem[];

/** True when `pathname` is the item's href/a child of it, or under any owned prefix. */
export function isNavItemActive(pathname: string, item: MemberNavItem): boolean {
  const prefixes = [item.href, ...item.match];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
