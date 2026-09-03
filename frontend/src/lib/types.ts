/** Shapes returned by the backend auth API (see backend `app/schemas/auth.py`). */

export type Role = "Team Member" | "Manager" | "Admin";

export type UserStatus = "active" | "disabled";

/** Matches the backend `UserResponse` model. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

/** Matches the backend `TokenResponse` model (`POST /auth/login`). */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

/** Matches the backend `AccessTokenResponse` model (`POST /auth/refresh`). */
export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export const ROLES: Role[] = ["Team Member", "Manager", "Admin"];

/** Roles allowed into the manager/admin area. */
export const MANAGER_ROLES: Role[] = ["Manager", "Admin"];

export function isManagerOrAdmin(role: Role): boolean {
  return role === "Manager" || role === "Admin";
}

/** Where a user lands after authenticating, based on their role. */
export function landingPathForRole(role: Role): string {
  return isManagerOrAdmin(role) ? "/admin" : "/dashboard";
}

/**
 * Shapes returned by the backend projects API (see backend
 * `app/schemas/project.py`). A "project" is also referred to as a "category" in
 * the product — the two are the same entity.
 */

/** Matches the backend `ProjectResponse` model. */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  /** User ids of the team members assigned to this project. */
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

/** Matches the backend `ProjectDeleteResponse` model (`DELETE /projects/{id}`). */
export interface ProjectDeleteResult {
  detail: string;
  /**
   * `true` when the project was kept but deactivated because reports still
   * reference it; `false` when the record was removed outright.
   */
  soft_deleted: boolean;
  project: Project | null;
}

/**
 * Shapes returned by the backend personal-weekly-report API (see backend
 * `app/schemas/report.py`). Every report shares one fixed structure — the same
 * fields, in the same order, for every user — so these types are exhaustive.
 */

export type ReportStatus = "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED";

export const REPORT_STATUSES: ReportStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "APPROVED",
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CORRECTION: "Needs correction",
  APPROVED: "Approved",
};

/** A report may only be edited by its owner while in one of these states. */
export function isReportEditable(status: ReportStatus): boolean {
  return status === "DRAFT" || status === "NEEDS_CORRECTION";
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

/** One completed-task row (backend `ReportTaskResponse` / `ReportTaskInput`). */
export interface ReportTask {
  task_name: string;
  priority: TaskPriority;
  planned_percentage: number;
  actual_percentage: number;
  status: TaskStatus;
  time_planned_hours: number;
  time_spent_hours: number;
  output_deliverable: string | null;
}

export interface Blocker {
  text: string;
  is_key_issue: boolean;
}

export interface Achievement {
  text: string;
  is_key_achievement: boolean;
}

export interface HoursWorkedBreakdown {
  development: number;
  testing: number;
  meetings: number;
  documentation: number;
  other: number;
}

/** One manager correction note in a report's review history. */
export interface ReviewComment {
  comment: string;
  manager_id: string;
  manager_name: string;
  against_version: number;
  created_at: string;
}

/** A frozen past version of a report, kept across correction cycles. */
export interface ReportVersion {
  version: number;
  snapshot_at: string;
  submitted_at: string | null;
  status_at_snapshot: ReportStatus;
  week_start_date: string;
  week_end_date: string;
  tasks_planned_next_week: string;
  tasks_completed: ReportTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hours_worked_breakdown: HoursWorkedBreakdown | null;
  notes_or_links: string | null;
}

/** Matches the backend `ReportResponse` model (`GET /reports/{id}`). */
export interface Report {
  id: string;
  user_id: string;
  project_id: string;
  week_start_date: string;
  week_end_date: string;
  status: ReportStatus;
  tasks_planned_next_week: string;
  tasks_completed: ReportTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hours_worked_breakdown: HoursWorkedBreakdown | null;
  notes_or_links: string | null;
  latest_review_comment: ReviewComment | null;
  review_comments: ReviewComment[];
  version_history: ReportVersion[];
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** One row in the report-history list (backend `ReportListItemResponse`). */
export interface ReportListItem {
  id: string;
  user_id: string;
  project_id: string;
  week_start_date: string;
  week_end_date: string;
  status: ReportStatus;
  latest_review_comment: ReviewComment | null;
  version_count: number;
  submitted_at: string | null;
  updated_at: string;
}

/** Paginated envelope returned by `GET /reports/me`. */
export interface ReportListResponse {
  items: ReportListItem[];
  total: number;
  page: number;
  page_size: number;
}
