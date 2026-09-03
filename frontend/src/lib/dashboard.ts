import "server-only";

/**
 * Manager "Dashboard & Visual Insights" data layer (assignment section 6).
 *
 * Everything here is derived from endpoints the frontend already talks to —
 * `GET /reports/dashboard/status`, `GET /reports/dashboard/section/{section}`,
 * `GET /reports/`, `GET /projects/`, `GET /users/` — so no backend change is
 * needed. The trend charts look back {@link TREND_WEEKS} weeks from the selected
 * week; the summary metrics and the "open blockers" figure are for the selected
 * week itself, and "needs correction" is a live count across every week.
 */

import { addDays, formatWeekRange, toISODate } from "@/lib/format";
import { getAssignableUsers, getProjects, type Result } from "@/lib/projects";
import { getTeamReports, getTeamSection, getTeamWeekStatus } from "@/lib/reports";
import { HOURS_TYPES, HOURS_TYPE_LABELS } from "@/lib/report-schema";
import { getAccessToken } from "@/lib/session";
import type {
  Blocker,
  HoursWorkedBreakdown,
  ReportListItem,
  ReportSectionKey,
  ReportTask,
  TeamSectionResponse,
  TeamStatusResponse,
} from "@/lib/types";

/** Weeks of history the trend charts cover, ending on the selected week. */
export const TREND_WEEKS = 6;

/**
 * A report counts as submitted "late" once this many days have passed since its
 * week began (i.e. it landed after the following Monday).
 */
const LATE_AFTER_DAYS = 7;

const EXPIRED = "Your session has expired. Sign in again.";

export interface InsightMetrics {
  weekStart: string;
  /** Reports past DRAFT for the selected week (submitted at least once). */
  submittedThisWeek: number;
  totalMembers: number;
  /** Submitted on or before the following Monday. */
  onTime: number;
  /** Submitted, but after the following Monday. */
  late: number;
  /** Still DRAFT or not started for the selected week. */
  pending: number;
  /** `(onTime + late) / totalMembers`, 0–1. */
  complianceRate: number;
  /** Reports currently in NEEDS_CORRECTION across every week. */
  needsCorrection: number;
  /** Blocker entries flagged across the team for the selected week. */
  openBlockers: number;
}

interface WeekPoint {
  week: string;
  label: string;
}

export interface TasksTrendPoint extends WeekPoint {
  completed: number;
  total: number;
}

export interface SubmissionTrendPoint extends WeekPoint {
  onTime: number;
  late: number;
  missing: number;
}

export interface MemberStatusRow {
  member: string;
  approved: number;
  submitted: number;
  needsCorrection: number;
  missing: number;
}

export interface ProjectWorkloadRow {
  project: string;
  tasks: number;
  hours: number;
}

export interface TaskTypeHoursRow {
  type: string;
  hours: number;
}

export type ActivityKind =
  | "submitted"
  | "resubmitted"
  | "approved"
  | "needs_correction";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  member: string;
  project: string;
  weekLabel: string;
  at: string;
  comment?: string;
}

export interface ManagerInsights {
  weeks: string[];
  weekStart: string;
  metrics: InsightMetrics;
  tasksTrend: TasksTrendPoint[];
  submissionTrend: SubmissionTrendPoint[];
  memberStatus: MemberStatusRow[];
  projectWorkload: ProjectWorkloadRow[];
  taskTypeHours: TaskTypeHoursRow[];
  activity: ActivityItem[];
  /** Non-fatal fetch failures, surfaced as a single dashboard notice. */
  partialErrors: string[];
}

function shortLabel(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function asArray<T>(content: unknown): T[] {
  return Array.isArray(content) ? (content as T[]) : [];
}

function dataOr<T>(result: Result<T>, fallback: T, errors: string[]): T {
  if ("data" in result) return result.data;
  errors.push(result.error);
  return fallback;
}

function emptyStatus(week: string, projectId?: string): TeamStatusResponse {
  return {
    week_start_date: week,
    project_id: projectId ?? null,
    total_members: 0,
    status_counts: {},
    rows: [],
  };
}

function emptySection(
  week: string,
  section: ReportSectionKey,
  projectId?: string
): TeamSectionResponse {
  return {
    week_start_date: week,
    section,
    project_id: projectId ?? null,
    entries: [],
  };
}

/** A submission is late if it landed more than a week after the week began. */
function isLate(weekStart: string, submittedAt: string): boolean {
  return toISODate(new Date(submittedAt)) > addDays(weekStart, LATE_AFTER_DAYS);
}

function toActivity(
  item: ReportListItem,
  userName: Map<string, string>,
  projectName: Map<string, string>
): ActivityItem {
  const base = {
    id: item.id,
    member: userName.get(item.user_id) ?? "A team member",
    project: projectName.get(item.project_id) ?? "Unknown project",
    weekLabel: formatWeekRange(item.week_start_date, item.week_end_date),
  };

  if (item.status === "APPROVED") {
    return { ...base, kind: "approved", at: item.updated_at };
  }
  if (item.status === "NEEDS_CORRECTION") {
    return {
      ...base,
      kind: "needs_correction",
      at: item.latest_review_comment?.created_at ?? item.updated_at,
      comment: item.latest_review_comment?.comment,
    };
  }
  return {
    ...base,
    kind: item.version_count > 0 ? "resubmitted" : "submitted",
    at: item.submitted_at ?? item.updated_at,
  };
}

export async function getManagerInsights(options: {
  weekStart: string;
  projectId?: string;
}): Promise<Result<ManagerInsights>> {
  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const { weekStart, projectId } = options;

  // Oldest → newest, ending on the selected week.
  const weeks: string[] = [];
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    weeks.push(addDays(weekStart, -7 * i));
  }

  const [
    statusResults,
    tasksResults,
    hoursResults,
    blockersResult,
    needsCorrectionResult,
    activityResult,
    projectsResult,
    usersResult,
  ] = await Promise.all([
    Promise.all(weeks.map((w) => getTeamWeekStatus(w, projectId))),
    Promise.all(
      weeks.map((w) => getTeamSection(w, "tasks_completed", projectId))
    ),
    Promise.all(
      weeks.map((w) => getTeamSection(w, "hours_worked_breakdown", projectId))
    ),
    getTeamSection(weekStart, "blockers", projectId),
    getTeamReports({ status: "NEEDS_CORRECTION", projectId, pageSize: 1 }),
    getTeamReports({ projectId, pageSize: 60 }),
    getProjects(),
    getAssignableUsers(),
  ]);

  const partialErrors: string[] = [];

  const statuses = statusResults.map((r, i) =>
    dataOr(r, emptyStatus(weeks[i], projectId), partialErrors)
  );
  const tasksSections = tasksResults.map((r, i) =>
    dataOr(r, emptySection(weeks[i], "tasks_completed", projectId), partialErrors)
  );
  const hoursSections = hoursResults.map((r, i) =>
    dataOr(
      r,
      emptySection(weeks[i], "hours_worked_breakdown", projectId),
      partialErrors
    )
  );
  const blockers = dataOr(
    blockersResult,
    emptySection(weekStart, "blockers", projectId),
    partialErrors
  );
  const projects = dataOr(projectsResult, [], partialErrors);
  const users = dataOr(usersResult, [], partialErrors);

  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  // -- Summary metrics (selected week) --------------------------------------
  const current = statuses[statuses.length - 1];
  const count = (key: string) => current.status_counts[key] ?? 0;
  const submittedThisWeek =
    count("SUBMITTED") + count("NEEDS_CORRECTION") + count("APPROVED");
  const pending = count("NOT_STARTED") + count("DRAFT");
  const totalMembers = current.total_members || current.rows.length;

  let onTime = 0;
  let late = 0;
  for (const row of current.rows) {
    if (!row.submitted_at) continue;
    if (isLate(weekStart, row.submitted_at)) late += 1;
    else onTime += 1;
  }

  const openBlockers = blockers.entries.reduce(
    (sum, entry) => sum + asArray<Blocker>(entry.content).length,
    0
  );

  let needsCorrection = 0;
  if ("data" in needsCorrectionResult) {
    needsCorrection = needsCorrectionResult.data.total;
  } else {
    partialErrors.push(needsCorrectionResult.error);
  }

  const metrics: InsightMetrics = {
    weekStart,
    submittedThisWeek,
    totalMembers,
    onTime,
    late,
    pending,
    complianceRate:
      totalMembers > 0 ? (onTime + late) / totalMembers : 0,
    needsCorrection,
    openBlockers,
  };

  // -- Tasks completed trend ---------------------------------------------
  const tasksTrend: TasksTrendPoint[] = tasksSections.map((section, i) => {
    let completed = 0;
    let total = 0;
    for (const entry of section.entries) {
      for (const task of asArray<ReportTask>(entry.content)) {
        total += 1;
        if (task.status === "COMPLETED") completed += 1;
      }
    }
    return { week: weeks[i], label: shortLabel(weeks[i]), completed, total };
  });

  // -- Submission status trend -----------------------------------------
  const submissionTrend: SubmissionTrendPoint[] = statuses.map((status, i) => {
    let weekOnTime = 0;
    let weekLate = 0;
    for (const row of status.rows) {
      if (!row.submitted_at) continue;
      if (isLate(weeks[i], row.submitted_at)) weekLate += 1;
      else weekOnTime += 1;
    }
    const missing =
      (status.status_counts["NOT_STARTED"] ?? 0) +
      (status.status_counts["DRAFT"] ?? 0);
    return {
      week: weeks[i],
      label: shortLabel(weeks[i]),
      onTime: weekOnTime,
      late: weekLate,
      missing,
    };
  });

  // -- Status by team member (aggregated over the window) ----------------
  const memberAgg = new Map<string, MemberStatusRow>();
  for (const status of statuses) {
    for (const row of status.rows) {
      const entry =
        memberAgg.get(row.user_id) ??
        ({
          member: row.user_name,
          approved: 0,
          submitted: 0,
          needsCorrection: 0,
          missing: 0,
        } satisfies MemberStatusRow);
      if (row.status === "APPROVED") entry.approved += 1;
      else if (row.status === "SUBMITTED") entry.submitted += 1;
      else if (row.status === "NEEDS_CORRECTION") entry.needsCorrection += 1;
      else entry.missing += 1;
      memberAgg.set(row.user_id, entry);
    }
  }
  const memberStatus = [...memberAgg.values()].sort((a, b) =>
    a.member.localeCompare(b.member)
  );

  // -- Workload by project (join tasks section ↔ status rows on report id) --
  const workloadAgg = new Map<string, { tasks: number; hours: number }>();
  tasksSections.forEach((section, i) => {
    const reportProject = new Map<string, string>();
    for (const row of statuses[i].rows) {
      if (row.report_id && row.project_id) {
        reportProject.set(row.report_id, row.project_id);
      }
    }
    for (const entry of section.entries) {
      const pid = entry.report_id
        ? reportProject.get(entry.report_id)
        : undefined;
      if (!pid) continue;
      const tasks = asArray<ReportTask>(entry.content);
      if (tasks.length === 0) continue;
      const acc = workloadAgg.get(pid) ?? { tasks: 0, hours: 0 };
      acc.tasks += tasks.length;
      acc.hours += tasks.reduce(
        (sum, task) => sum + (Number(task.time_spent_hours) || 0),
        0
      );
      workloadAgg.set(pid, acc);
    }
  });
  const projectWorkload: ProjectWorkloadRow[] = [...workloadAgg.entries()]
    .map(([pid, value]) => ({
      project: projectName.get(pid) ?? "Unknown project",
      tasks: value.tasks,
      hours: Math.round(value.hours * 10) / 10,
    }))
    .sort((a, b) => b.tasks - a.tasks);

  // -- Time spent by task type (team-wide, over the window) --------------
  const hoursTotals: Record<string, number> = {
    development: 0,
    testing: 0,
    meetings: 0,
    documentation: 0,
    other: 0,
  };
  for (const section of hoursSections) {
    for (const entry of section.entries) {
      const breakdown = entry.content as HoursWorkedBreakdown | null;
      if (!breakdown || typeof breakdown !== "object") continue;
      for (const key of HOURS_TYPES) {
        hoursTotals[key] += Number(breakdown[key]) || 0;
      }
    }
  }
  const taskTypeHours: TaskTypeHoursRow[] = HOURS_TYPES.map((key) => ({
    type: HOURS_TYPE_LABELS[key],
    hours: Math.round(hoursTotals[key] * 10) / 10,
  })).filter((row) => row.hours > 0);

  // -- Recent activity feed --------------------------------------------
  const activityItems = "data" in activityResult ? activityResult.data.items : [];
  if (!("data" in activityResult)) partialErrors.push(activityResult.error);
  const activity = activityItems
    .map((item) => toActivity(item, userName, projectName))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 15);

  return {
    data: {
      weeks,
      weekStart,
      metrics,
      tasksTrend,
      submissionTrend,
      memberStatus,
      projectWorkload,
      taskTypeHours,
      activity,
      partialErrors: [...new Set(partialErrors)],
    },
  };
}
