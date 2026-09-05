import Link from "next/link";

import { requireUser } from "@/lib/session";
import { isManager } from "@/lib/types";
import { AppSidebar, AppSidebarMobile } from "@/components/app-sidebar";
import { BackButton } from "@/components/back-button";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const canManage = isManager(user.role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Weekly Report Generator logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-primary">
              Weekly Report Generator
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="hidden text-right text-sm transition-opacity hover:opacity-80 sm:block"
            >
              <div className="font-medium leading-tight text-[#1e50ae]">
                {user.name}
              </div>
              <div className="text-xs text-[#1e50ae]/70">{user.role}</div>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <AppSidebarMobile canManage={canManage} />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="sticky top-16 z-30 hidden h-[calc(100vh-4rem)] w-56 shrink-0 self-start overflow-y-auto border-r bg-card md:block">
          <AppSidebar canManage={canManage} />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="container py-8">
            <BackButton />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
