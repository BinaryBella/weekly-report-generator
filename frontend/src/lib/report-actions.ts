"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

const EXPIRED = "Your session has expired. Sign in again.";

/** State returned by the report entry form action (drives `useActionState`). */
export interface ReportEntryFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  reportId?: string;
}

/**
 * Create a weekly report entry in DRAFT for the current user. Backend:
 * `POST /reports/` (any authenticated user). This form exists mainly to let a
 * Team Member attach a project/category to their report — the full reporting
 * workspace lives in its own section.
 */
export async function createReportEntryAction(
  _prev: ReportEntryFormState,
  formData: FormData
): Promise<ReportEntryFormState> {
  const projectId = String(formData.get("project_id") ?? "").trim();
  const weekStart = String(formData.get("week_start_date") ?? "").trim();
  const weekEnd = String(formData.get("week_end_date") ?? "").trim();
  const tasksPlanned = String(
    formData.get("tasks_planned_next_week") ?? ""
  ).trim();
  const notes = String(formData.get("notes_or_links") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!projectId) fieldErrors.project_id = "Choose a project / category.";
  if (!weekStart) fieldErrors.week_start_date = "Pick the week start date.";
  if (!weekEnd) fieldErrors.week_end_date = "Pick the week end date.";
  if (weekStart && weekEnd && weekStart >= weekEnd) {
    fieldErrors.week_end_date = "The week end must be after the week start.";
  }
  if (!tasksPlanned) {
    fieldErrors.tasks_planned_next_week = "Describe what's planned for next week.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch("/reports/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_id: projectId,
      week_start_date: weekStart,
      week_end_date: weekEnd,
      tasks_planned_next_week: tasksPlanned,
      ...(notes ? { notes_or_links: notes } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not save the report.");
    // A 400 here means the backend rejected the chosen project id.
    if (res.status === 400) return { fieldErrors: { project_id: detail } };
    return { error: detail };
  }

  const report = (await res.json()) as { id: string };
  revalidatePath("/dashboard");
  return { ok: true, reportId: report.id };
}
