import "server-only";

/**
 * Base URL of the already-implemented backend auth API, including its version
 * prefix (e.g. `http://127.0.0.1:8000/api/v1`). Server-side only — this value is
 * never shipped to the browser, so every backend call is proxied through Next.
 */
export const BACKEND_API_URL =
  process.env.BACKEND_API_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v1";

export function backendUrl(path: string): string {
  return `${BACKEND_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Thin wrapper around `fetch` for backend calls. Auth is caller-supplied. */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    // Auth responses must never be cached.
    cache: "no-store",
  });
}

/** Pull a human-readable message out of a FastAPI error body. */
export async function readErrorDetail(
  res: Response,
  fallback = "Something went wrong. Please try again."
): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg as string;
    }
  } catch {
    /* non-JSON body */
  }
  return fallback;
}
