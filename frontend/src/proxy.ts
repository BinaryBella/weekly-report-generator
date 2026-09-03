import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection + transparent access-token renewal.
 *
 * Middleware is the one place Next.js allows setting cookies during a plain
 * navigation, so this is where a short-lived access token is refreshed from the
 * long-lived refresh token before the request reaches a protected page.
 *
 * Fine-grained *role* checks (Team Member vs Manager/Admin) live in the
 * per-section server layouts, which can call the backend `/auth/me`.
 */

const ACCESS_COOKIE = "wrg_access";
const REFRESH_COOKIE = "wrg_refresh";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

const BACKEND_API_URL =
  process.env.BACKEND_API_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v1";

const cookieSecure = process.env.COOKIE_SECURE === "1";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
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

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  // --- Already-authenticated users shouldn't see login/register ---
  if (AUTH_PAGES.includes(pathname) && access) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // --- Protected route: valid access token present ---
  if (access) {
    return NextResponse.next();
  }

  // --- Protected route: no access token, but a refresh token — renew it ---
  if (refresh) {
    const renewed = await tryRefresh(refresh);
    if (renewed) {
      const res = NextResponse.next();
      res.cookies.set(ACCESS_COOKIE, renewed.access_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: cookieSecure,
        path: "/",
        maxAge: Math.max(renewed.expires_in - 15, 30),
      });
      return res;
    }
  }

  // --- Not authenticated: send to login, remembering where they were headed ---
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
