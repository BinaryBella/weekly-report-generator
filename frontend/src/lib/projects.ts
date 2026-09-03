import "server-only";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { Project, User } from "@/lib/types";

/** A successful fetch, or a human-readable error to render in place. */
export type Result<T> = { data: T } | { error: string };

const EXPIRED = "Your session has expired. Sign in again.";

/**
 * Load projects/categories from the backend. Any authenticated user may read
 * this list; pass `activeOnly` to hide deactivated projects (used by the report
 * entry selector, where a Team Member should only pick a live project).
 */
export async function getProjects(
  activeOnly = false
): Promise<Result<Project[]>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const query = activeOnly ? "?active_only=true" : "";
  const res = await apiFetch(`/projects/${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load projects.") };
  }
  return { data: (await res.json()) as Project[] };
}

/**
 * Load the users that can be assigned to a project. The backend only lets a
 * Manager/Admin enumerate users, which matches who is allowed to edit project
 * membership, so this is safe to call from the projects management screen.
 */
export async function getAssignableUsers(): Promise<Result<User[]>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch("/users/?limit=200", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load team members.") };
  }
  return { data: (await res.json()) as User[] };
}
