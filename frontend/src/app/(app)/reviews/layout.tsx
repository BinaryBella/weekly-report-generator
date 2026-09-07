import { requireRole } from "@/lib/session";
import { MANAGER_ROLES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Manager-only review area. A Team Member who reaches any `/reviews/*`
 * route is redirected to their own dashboard by `requireRole`.
 */
export default async function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(MANAGER_ROLES, "/reviews");
  return <>{children}</>;
}
