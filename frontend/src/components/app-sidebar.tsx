"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  managerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  // Personal landing page — team members have no analytics dashboard, only a home.
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "My reports", icon: FileText },
  // Team dashboard + visual insights are Manager-only (assignment sections 4 & 6).
  { href: "/reviews", label: "Team dashboard", icon: Users, managerOnly: true },
  { href: "/reviews/insights", label: "Insights", icon: BarChart3, managerOnly: true },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin", label: "Members", icon: Shield, managerOnly: true },
];

/**
 * Resolve the visible items and which one matches the current route. The active
 * item is the one whose href is the longest prefix of the pathname, so
 * `/dashboard/reports/new` lights up "My reports" (not "Dashboard") and
 * `/reviews/insights` lights up "Insights" (not "Team").
 */
function useNav(canManage: boolean) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.managerOnly || canManage);

  let activeHref = "";
  for (const item of items) {
    const onIt =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (onIt && item.href.length > activeHref.length) activeHref = item.href;
  }

  return { items, activeHref };
}

export function AppSidebar({ canManage }: { canManage: boolean }) {
  const { items, activeHref } = useNav(canManage);

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebarMobile({ canManage }: { canManage: boolean }) {
  const { items, activeHref } = useNav(canManage);

  return (
    <nav className="sticky top-16 z-30 flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
