import { requireRole } from "@/lib/session";
import { MANAGER_ROLES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Manager/Admin-only section. A Team Member who reaches any `/admin/*` route is
 * redirected to their own dashboard by `requireRole`.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(MANAGER_ROLES, "/admin");
  return <>{children}</>;
}
