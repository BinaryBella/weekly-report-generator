"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { REVIEW_COMMENT_MAX } from "@/lib/report-schema";
import { getAccessToken } from "@/lib/session";

const EXPIRED = "Your session has expired. Sign in again.";

/** Result of a manager review action, consumed by the review panel. */
export interface ReviewActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateReport(reportId: string): void {
  revalidatePath("/reviews");
  revalidatePath(`/reviews/${reportId}`);
  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${reportId}`);
}

/**
 * Approve a submitted report. Backend: `POST /reports/{id}/approve`
 * (Manager only) — SUBMITTED → APPROVED. Managers never touch the report
 * content, only its status.
 */
export async function approveReportAction(
  reportId: string
): Promise<ReviewActionState> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/reports/${reportId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not approve the report."),
    };
  }

  revalidateReport(reportId);
  return { ok: true };
}

/**
 * Send a submitted report back for correction with one general comment.
 * Backend: `POST /reports/{id}/request-changes` (Manager only) —
 * SUBMITTED → NEEDS_CORRECTION. The reviewed content is snapshotted into the
 * report's version history first, so the resubmission does not overwrite it.
 */
export async function requestChangesAction(
  reportId: string,
  comment: string
): Promise<ReviewActionState> {
  const trimmed = comment.trim();
  if (!trimmed) {
    return {
      fieldErrors: { comment: "Explain what needs to change before sending it back." },
    };
  }
  if (trimmed.length > REVIEW_COMMENT_MAX) {
    return {
      fieldErrors: {
        comment: `Keep the comment under ${REVIEW_COMMENT_MAX} characters.`,
      },
    };
  }

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/reports/${reportId}/request-changes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: trimmed }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(
        res,
        "Could not send the report back for correction."
      ),
    };
  }

  revalidateReport(reportId);
  return { ok: true };
}
