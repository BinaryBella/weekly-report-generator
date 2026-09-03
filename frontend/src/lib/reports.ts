import "server-only";

import { apiFetch, readErrorDetail } from "@/lib/api";
import type { Result } from "@/lib/projects";
import { getAccessToken } from "@/lib/session";
import type { Report, ReportListResponse, ReportStatus } from "@/lib/types";

const EXPIRED = "Your session has expired. Sign in again.";

/**
 * Load the current user's own report history, newest week first. Backend:
 * `GET /reports/me` (any authenticated user; only ever returns the caller's
 * reports). `status` narrows the list to a single lifecycle state.
 */
export async function getMyReports(options?: {
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}): Promise<Result<ReportListResponse>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  params.set("page", String(options?.page ?? 1));
  params.set("page_size", String(options?.pageSize ?? 100));

  const res = await apiFetch(`/reports/me?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load your reports.") };
  }
  return { data: (await res.json()) as ReportListResponse };
}

/**
 * Load every team member's reports for the manager review dashboard. Backend:
 * `GET /reports/` (Manager/Admin only). Private drafts are never included. All
 * filters are optional and AND-combined.
 */
export async function getTeamReports(options?: {
  status?: ReportStatus;
  userId?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}): Promise<Result<ReportListResponse>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.userId) params.set("user_id", options.userId);
  if (options?.projectId) params.set("project_id", options.projectId);
  params.set("page", String(options?.page ?? 1));
  params.set("page_size", String(options?.pageSize ?? 100));

  const res = await apiFetch(`/reports/?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) {
    return { error: "Only managers and admins can review team reports." };
  }
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load team reports.") };
  }
  return { data: (await res.json()) as ReportListResponse };
}

/**
 * Load one report in full. Backend: `GET /reports/{id}` — the owner always; a
 * Manager/Admin only once it has left DRAFT. A `403`/`404` is turned into a
 * friendly message rather than a raw error.
 */
export async function getReport(reportId: string): Promise<Result<Report>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return { error: "That report could not be found." };
  if (res.status === 403) {
    return { error: "You do not have access to that report." };
  }
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load the report.") };
  }
  return { data: (await res.json()) as Report };
}
