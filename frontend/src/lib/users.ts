import "server-only";

import { apiFetch, readErrorDetail } from "@/lib/api";
import type { Result } from "@/lib/projects";
import { getAccessToken } from "@/lib/session";
import type { User } from "@/lib/types";

const EXPIRED = "Your session has expired. Sign in again.";

/**
 * Load a single user record. Backend: `GET /users/{id}` — a Manager may read
 * any user; a Team Member may only read their own (`403` otherwise).
 */
export async function getUser(userId: string): Promise<Result<User>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) {
    return { error: "That team member could not be found." };
  }
  if (res.status === 403) {
    return { error: "You do not have access to that profile." };
  }
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load that team member.") };
  }
  return { data: (await res.json()) as User };
}
