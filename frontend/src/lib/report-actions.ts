"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import {
  cleanReportInput,
  validateReportInput,
  type ReportInput,
} from "@/lib/report-schema";
import { getAccessToken } from "@/lib/session";
import type { Report } from "@/lib/types";

const EXPIRED = "Your session has expired. Sign in again.";
const LIST_PATH = "/dashboard/reports";

/** Result of a create / update action, consumed by the client form. */
export interface ReportActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  reportId?: string;
}

function jsonHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** A `400` mentioning the project means the chosen project id was rejected. */
function isProjectError(status: number, detail: string): boolean {
  return status === 400 && /project/i.test(detail);
}

/** Map a backend save failure onto the right field, or a general message. */
function toSaveError(status: number, detail: string): ReportActionState {
  if (isProjectError(status, detail)) {
    return { fieldErrors: { project_id: detail } };
  }
  return { error: detail };
}

/**
 * Create a weekly report in DRAFT for the current user. Backend:
 * `POST /reports/` — always creates a DRAFT owned by the caller.
 */
export async function createReportAction(
  input: ReportInput
): Promise<ReportActionState> {
  const fieldErrors = validateReportInput(input);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch("/reports/", {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(cleanReportInput(input)),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not save the report.");
    return toSaveError(res.status, detail);
  }

  const report = (await res.json()) as Report;
  revalidatePath(LIST_PATH);
  return { ok: true, reportId: report.id };
}

/**
 * Replace the content of a report the caller owns. Backend: `PUT /reports/{id}`
 * — allowed only while the report is in DRAFT or NEEDS_CORRECTION.
 */
export async function updateReportAction(
  reportId: string,
  input: ReportInput
): Promise<ReportActionState> {
  const fieldErrors = validateReportInput(input);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/reports/${reportId}`, {
    method: "PUT",
    headers: jsonHeaders(token),
    body: JSON.stringify(cleanReportInput(input)),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not save the report.");
    return toSaveError(res.status, detail);
  }

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${reportId}`);
  return { ok: true, reportId };
}

/**
 * Submit a report for manager review. Backend: `POST /reports/{id}/submit` —
 * DRAFT / NEEDS_CORRECTION → SUBMITTED.
 */
export async function submitReportAction(
  reportId: string
): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/reports/${reportId}/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not submit the report."),
    };
  }

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${reportId}`);
  return { ok: true };
}
