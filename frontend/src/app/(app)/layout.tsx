import Link from "next/link";

import { requireUser } from "@/lib/session";
import { isManagerOrAdmin } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const canManage = isManagerOrAdmin(user.role);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-primary">Weekly Report Generator</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Projects
              </Link>
              {canManage ? (
                <Link
                  href="/admin"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
