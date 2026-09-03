/**
 * The fixed weekly-report structure, shared by the client form and the server
 * actions. Kept free of `server-only` imports so it can run in the browser
 * (mirrors `src/lib/validation.ts`). Rules here match the backend's
 * `app/schemas/report.py`: fixed field set, week start strictly before week end,
 * and — when a list is non-empty — exactly one "key" blocker / achievement.
 */

import type {
  Achievement,
  Blocker,
  HoursWorkedBreakdown,
  Report,
  ReportTask,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_STATUSES: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

export const HOURS_TYPES = [
  "development",
  "testing",
  "meetings",
  "documentation",
  "other",
] as const;
export type HoursType = (typeof HOURS_TYPES)[number];
export const HOURS_TYPE_LABELS: Record<HoursType, string> = {
  development: "Development",
  testing: "Testing",
  meetings: "Meetings",
  documentation: "Documentation",
  other: "Other",
};

// Field limits — kept in step with the backend `Field(max_length=...)` values.
export const TASK_NAME_MAX = 200;
export const TEXT_MAX = 2000;
export const TASKS_PLANNED_MAX = 5000;
export const NOTES_MAX = 5000;

/** Exactly the payload `POST /reports/` and `PUT /reports/{id}` accept. */
export interface ReportInput {
  project_id: string;
  week_start_date: string;
  week_end_date: string;
  tasks_planned_next_week: string;
  tasks_completed: ReportTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hours_worked_breakdown: HoursWorkedBreakdown | null;
  notes_or_links: string | null;
}

export function emptyTask(): ReportTask {
  return {
    task_name: "",
    priority: "MEDIUM",
    planned_percentage: 0,
    actual_percentage: 0,
    status: "NOT_STARTED",
    time_planned_hours: 0,
    time_spent_hours: 0,
    output_deliverable: "",
  };
}

export function emptyHours(): HoursWorkedBreakdown {
  return { development: 0, testing: 0, meetings: 0, documentation: 0, other: 0 };
}

export function blankReportInput(): ReportInput {
  return {
    project_id: "",
    week_start_date: "",
    week_end_date: "",
    tasks_planned_next_week: "",
    tasks_completed: [],
    blockers: [],
    achievements: [],
    hours_worked_breakdown: null,
    notes_or_links: "",
  };
}

/** Seed the form from an existing report (edit / correction flow). */
export function reportToInput(report: Report): ReportInput {
  return {
    project_id: report.project_id,
    week_start_date: report.week_start_date.slice(0, 10),
    week_end_date: report.week_end_date.slice(0, 10),
    tasks_planned_next_week: report.tasks_planned_next_week,
    tasks_completed: report.tasks_completed.map((t) => ({
      ...t,
      output_deliverable: t.output_deliverable ?? "",
    })),
    blockers: report.blockers.map((b) => ({ ...b })),
    achievements: report.achievements.map((a) => ({ ...a })),
    hours_worked_breakdown: report.hours_worked_breakdown
      ? { ...report.hours_worked_breakdown }
      : null,
    notes_or_links: report.notes_or_links ?? "",
  };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function nonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function blockersWithSingleKey(items: Blocker[]): Blocker[] {
  if (items.length === 0) return items;
  let key = items.findIndex((b) => b.is_key_issue);
  if (key < 0) key = 0;
  return items.map((b, i) => ({ text: b.text, is_key_issue: i === key }));
}

function achievementsWithSingleKey(items: Achievement[]): Achievement[] {
  if (items.length === 0) return items;
  let key = items.findIndex((a) => a.is_key_achievement);
  if (key < 0) key = 0;
  return items.map((a, i) => ({ text: a.text, is_key_achievement: i === key }));
}

/**
 * Normalise a form payload into exactly what the backend accepts: blank task /
 * blocker / achievement rows dropped, strings trimmed, numbers clamped, and the
 * "key" flag forced onto exactly one blocker / achievement when the list is
 * non-empty. An all-zero hours breakdown collapses to `null` (the field is
 * optional).
 */
export function cleanReportInput(input: ReportInput): ReportInput {
  const tasks_completed: ReportTask[] = input.tasks_completed
    .map((t) => ({
      task_name: t.task_name.trim(),
      priority: t.priority,
      planned_percentage: clampPct(t.planned_percentage),
      actual_percentage: clampPct(t.actual_percentage),
      status: t.status,
      time_planned_hours: nonNegative(t.time_planned_hours),
      time_spent_hours: nonNegative(t.time_spent_hours),
      output_deliverable: (t.output_deliverable ?? "").trim() || null,
    }))
    .filter((t) => t.task_name.length > 0);

  const blockers = blockersWithSingleKey(
    input.blockers
      .map((b) => ({ text: b.text.trim(), is_key_issue: b.is_key_issue }))
      .filter((b) => b.text.length > 0)
  );

  const achievements = achievementsWithSingleKey(
    input.achievements
      .map((a) => ({
        text: a.text.trim(),
        is_key_achievement: a.is_key_achievement,
      }))
      .filter((a) => a.text.length > 0)
  );

  const h = input.hours_worked_breakdown;
  const hasHours = h != null && HOURS_TYPES.some((k) => nonNegative(h[k]) > 0);
  const hours_worked_breakdown: HoursWorkedBreakdown | null = hasHours
    ? {
        development: nonNegative(h.development),
        testing: nonNegative(h.testing),
        meetings: nonNegative(h.meetings),
        documentation: nonNegative(h.documentation),
        other: nonNegative(h.other),
      }
    : null;

  return {
    project_id: input.project_id.trim(),
    week_start_date: input.week_start_date,
    week_end_date: input.week_end_date,
    tasks_planned_next_week: input.tasks_planned_next_week.trim(),
    tasks_completed,
    blockers,
    achievements,
    hours_worked_breakdown,
    notes_or_links: (input.notes_or_links ?? "").trim() || null,
  };
}

export type ReportFieldErrors = Record<string, string>;

/** Client-side checks mirroring the backend's structural validation. */
export function validateReportInput(input: ReportInput): ReportFieldErrors {
  const errors: ReportFieldErrors = {};
  const clean = cleanReportInput(input);

  if (!clean.project_id) errors.project_id = "Choose a project / category.";
  if (!clean.week_start_date) {
    errors.week_start_date = "Pick the week start date.";
  }
  if (!clean.week_end_date) {
    errors.week_end_date = "Pick the week end date.";
  }
  if (
    clean.week_start_date &&
    clean.week_end_date &&
    clean.week_start_date >= clean.week_end_date
  ) {
    errors.week_end_date = "The week end must be after the week start.";
  }

  if (!clean.tasks_planned_next_week) {
    errors.tasks_planned_next_week = "Describe what's planned for next week.";
  } else if (clean.tasks_planned_next_week.length > TASKS_PLANNED_MAX) {
    errors.tasks_planned_next_week = `Keep this under ${TASKS_PLANNED_MAX} characters.`;
  }

  // A row with details filled in but no name can't be submitted.
  const namelessRow = input.tasks_completed.some(
    (t) =>
      !t.task_name.trim() &&
      ((t.output_deliverable ?? "").trim().length > 0 ||
        t.planned_percentage > 0 ||
        t.actual_percentage > 0 ||
        t.time_planned_hours > 0 ||
        t.time_spent_hours > 0)
  );
  if (namelessRow) {
    errors.tasks_completed = "Give every task a name, or remove the empty row.";
  }

  if (clean.notes_or_links && clean.notes_or_links.length > NOTES_MAX) {
    errors.notes_or_links = `Keep notes under ${NOTES_MAX} characters.`;
  }

  return errors;
}
