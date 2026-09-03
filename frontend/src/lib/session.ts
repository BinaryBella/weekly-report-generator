import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Role, TokenResponse, User } from "@/lib/types";

/**
 * Session handling.
 *
 * Tokens issued by the backend (`access_token`, `refresh_token`) are kept in
 * httpOnly, SameSite=Lax cookies so they are never readable by client-side
 * JavaScript. The browser only ever holds an opaque cookie; every authenticated
 * backend request is made from the server with the bearer token attached here.
 *
 * The short-lived access token is transparently renewed from the refresh token
 * in `middleware.ts` (the only place Next.js lets us set cookies on a plain
 * navigation).
 */

export const ACCESS_COOKIE = "wrg_access";
export const REFRESH_COOKIE = "wrg_refresh";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches backend refresh TTL.

// `cookies()` resolves to this mutable store (Server Actions / Route Handlers).
type CookieStore = Awaited<ReturnType<typeof cookies>>;

function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE === "1";
}

/** Persist a freshly issued token pair into httpOnly cookies. */
export function writeSessionCookies(
  store: CookieStore,
  tokens: Pick<TokenResponse, "access_token" | "expires_in"> & {
    refresh_token?: string;
  }
): void {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
  };

  store.set(ACCESS_COOKIE, tokens.access_token, {
    ...base,
    // Give the cookie a touch less life than the token so a stale token is
    // dropped rather than sent and rejected.
    maxAge: Math.max(tokens.expires_in - 15, 30),
  });

  if (tokens.refresh_token) {
    store.set(REFRESH_COOKIE, tokens.refresh_token, {
      ...base,
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

/** Remove both session cookies (logout / failed refresh). */
export function clearSessionCookies(store: CookieStore): void {
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

/**
 * Resolve the current user by calling the backend `GET /auth/me` with the access
 * token cookie. Returns `null` when there is no valid session. Token renewal is
 * handled upstream in middleware, so a `null` here means "truly signed out".
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await apiFetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return (await res.json()) as User;
}

/** Require an authenticated user or redirect to the login page. */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
    );
  }
  return user;
}

/**
 * Require an authenticated user whose role is one of `allowed`. An authenticated
 * user without a sufficient role is bounced to their own dashboard rather than
 * the login page.
 */
export async function requireRole(
  allowed: Role[],
  nextPath?: string
): Promise<User> {
  const user = await requireUser(nextPath);
  if (!allowed.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
