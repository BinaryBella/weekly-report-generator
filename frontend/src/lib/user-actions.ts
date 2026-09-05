"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { validateInvite, type InviteValues } from "@/lib/validation";
import type { Role, User, UserStatus } from "@/lib/types";

const EXPIRED = "Your session has expired. Sign in again.";
const ADMIN_PATH = "/admin";

/** Result of inviting a team member. */
export interface CreateUserState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  user?: User;
  /** Present only when the server auto-generated (or wasn't told to email) a password. */
  temporaryPassword?: string | null;
  /** Whether the server actually emailed the credentials. */
  emailSent?: boolean;
}

/**
 * Invite a team member. Backend: `POST /users/` (Manager only) — creates the
 * account and emails the sign-in credentials when SMTP is configured; the
 * temporary password is always also returned once so a Manager can share it
 * out of band if email isn't set up or delivery fails.
 */
export async function createUserAction(
  input: InviteValues & { role: Role }
): Promise<CreateUserState> {
  const fieldErrors = validateInvite(input);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch("/users/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      password: input.password || undefined,
    }),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not invite the team member.");
    if (res.status === 400 && /email/i.test(detail)) {
      return { fieldErrors: { email: detail } };
    }
    return { error: detail };
  }

  const body = (await res.json()) as {
    user: User;
    temporary_password: string | null;
    email_sent: boolean;
  };

  revalidatePath(ADMIN_PATH);
  return {
    ok: true,
    user: body.user,
    temporaryPassword: body.temporary_password,
    emailSent: body.email_sent,
  };
}

/**
 * Enable or disable a team member's account. Backend:
 * `PATCH /users/{id}/status` (Manager only). Disabling is not itself
 * "removing" a user — see `deleteUserAction` for that — but a Manager can also
 * reactivate a disabled account from here.
 */
export async function updateUserStatusAction(
  userId: string,
  status: UserStatus
): Promise<{ ok: boolean; error?: string; user?: User }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not update the account."),
    };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, user: (await res.json()) as User };
}

/** Result of removing a team member. */
export interface DeleteUserState {
  ok: boolean;
  error?: string;
  /** True when the account was disabled (kept, for existing history) rather than deleted outright. */
  softDeleted?: boolean;
  detail?: string;
}

/**
 * Remove a team member. Backend: `DELETE /users/{id}` (Manager only) — deletes
 * the account outright if it has no reports or project assignments, otherwise
 * disables it so past reports/projects stay intact and says which happened.
 */
export async function deleteUserAction(userId: string): Promise<DeleteUserState> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not remove the team member."),
    };
  }

  const body = (await res.json()) as { detail: string; soft_deleted: boolean };
  revalidatePath(ADMIN_PATH);
  return { ok: true, detail: body.detail, softDeleted: body.soft_deleted };
}
