import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection + transparent access-token renewal.
 *
 * Middleware is the one place Next.js allows setting cookies during a plain
 * navigation, so this is where a short-lived access token is refreshed from the
 * long-lived refresh token before the request reaches a protected page.
 *
 * Two gates run here, both fail-safe (a backend blip falls through to the
 * per-section server layouts, which repeat the same checks):
 *   - auth      — no session → `/login?next=…` for every protected route
 *   - role      — a Team Member reaching a Manager area → `/dashboard`
 */

const ACCESS_COOKIE = "wrg_access";
const REFRESH_COOKIE = "wrg_refresh";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/projects",
  "/reviews",
  "/account",
];
/** Subset of the protected routes that only a Manager may open. */
const MANAGER_PREFIXES = ["/admin", "/reviews"];
const AUTH_PAGES = ["/login", "/register"];

const BACKEND_API_URL =
  process.env.BACKEND_API_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v1";

const cookieSecure = process.env.COOKIE_SECURE === "1";

const accessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: cookieSecure,
  path: "/",
};

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function tryRefresh(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { access_token: string; expires_in: number };
  } catch {
    return null;
  }
}

/**
 * Resolve the caller's role from the backend. Returns `null` when it cannot be
 * determined (network error, expired token) so the caller can fall through to
 * the server-layout check rather than lock a real Manager out on a blip.
 */
async function fetchRole(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { role?: string };
    return user.role ?? null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  // --- Already-authenticated users shouldn't see login/register ---
  if (AUTH_PAGES.includes(pathname) && access) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    return NextResponse.next();
  }

  // --- Resolve an effective access token: the one we have, or a renewed one ---
  let effectiveAccess = access;
  let renewed: { access_token: string; expires_in: number } | null = null;
  if (!effectiveAccess && refresh) {
    renewed = await tryRefresh(refresh);
    if (renewed) effectiveAccess = renewed.access_token;
  }

  // --- Not authenticated: send to login, remembering where they were headed ---
  if (!effectiveAccess) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const withRenewedCookie = (res: NextResponse): NextResponse => {
    if (renewed) {
      res.cookies.set(ACCESS_COOKIE, renewed.access_token, {
        ...accessCookieOptions,
        maxAge: Math.max(renewed.expires_in - 15, 30),
      });
    }
    return res;
  };

  // --- Role gate: a Team Member in a Manager area goes to their dashboard ---
  if (matchesPrefix(pathname, MANAGER_PREFIXES)) {
    const role = await fetchRole(effectiveAccess);
    if (role === "Team Member") {
      return withRenewedCookie(
        NextResponse.redirect(new URL("/dashboard", req.url))
      );
    }
    // role === null → couldn't check; the section layout's requireRole still guards it.
  }

  return withRenewedCookie(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/projects/:path*",
    "/reviews/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
