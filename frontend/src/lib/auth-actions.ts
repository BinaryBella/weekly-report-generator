"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  getAccessToken,
  writeSessionCookies,
} from "@/lib/session";
import {
  landingPathForRole,
  ROLES,
  type Role,
  type TokenResponse,
  type User,
} from "@/lib/types";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Only allow same-origin, absolute-path redirect targets. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/**
 * Log in with email + password.
 *
 * The backend `POST /auth/login` consumes an OAuth2 password *form* (not JSON),
 * with the email supplied in the `username` field.
 */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    return { error: await readErrorDetail(res, "Incorrect email or password.") };
  }

  const tokens = (await res.json()) as TokenResponse;
  writeSessionCookies(await cookies(), tokens);

  // Resolve the role so we can land the user in the right area.
  let role: Role = "Team Member";
  const me = await apiFetch("/auth/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (me.ok) {
    role = ((await me.json()) as User).role;
  }

  redirect(next ?? landingPathForRole(role));
}

/**
 * Register a new account. The backend always assigns the `Team Member` role to
 * self-registrations, so no role field is sent.
 */
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Enter your name.";
  if (!email) fieldErrors.email = "Enter your email.";
  if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const res = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    return {
      error: await readErrorDetail(res, "Could not create your account."),
    };
  }

  redirect("/login?registered=1");
}

/**
 * Revoke the current tokens on the backend and drop the session cookies.
 * Idempotent and best-effort: the cookies are cleared even if the backend call
 * fails.
 */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (access) {
    try {
      const init: RequestInit = {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      };
      if (refresh) {
        init.headers = {
          ...init.headers,
          "Content-Type": "application/json",
        };
        init.body = JSON.stringify({ refresh_token: refresh });
      }
      await apiFetch("/auth/logout", init);
    } catch {
      /* best-effort — the session is torn down locally regardless */
    }
  }

  clearSessionCookies(store);
  redirect("/login");
}

/**
 * Assign a role to a user (backend `PATCH /users/{id}/role`, Admin only). The
 * backend enforces the "Admin only" rule and rejects an admin changing their own
 * role; this action just surfaces whatever it says.
 */
export async function assignRoleAction(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  if (!ROLES.includes(role)) {
    return { ok: false, error: "Unknown role." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  const res = await apiFetch(`/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not update the role."),
    };
  }

  revalidatePath("/admin");
  return { ok: true };
}
