import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { landingPathForRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? landingPathForRole(user.role) : "/login");
}
