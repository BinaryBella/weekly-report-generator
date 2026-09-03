import Link from "next/link";

import { formatDateTime, formatWeekRange } from "@/lib/format";
import {
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  type ReportListItem,
  type ReportStatus,
} from "@/lib/types";
import { ReportStatusBadge } from "@/components/report-status-badge";

/** Newest week first; ties broken by most recently updated. */
function byWeekDesc(a: ReportListItem, b: ReportListItem): number {
  if (a.week_start_date !== b.week_start_date) {
    return a.week_start_date < b.week_start_date ? 1 : -1;
  }
  return a.updated_at < b.updated_at ? 1 : -1;
}

/**
 * The user's own report history, organised by week, each row showing its
 * current status. Status filter chips link back to this page with `?status=`.
 */
export function ReportsHistory({
  items,
  projectNames,
  activeStatus,
}: {
  items: ReportListItem[];
  projectNames: Record<string, string>;
  activeStatus?: ReportStatus;
}) {
  const sorted = [...items].sort(byWeekDesc);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          href="/dashboard/reports"
          active={!activeStatus}
        />
        {REPORT_STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={REPORT_STATUS_LABELS[status]}
            href={`/dashboard/reports?status=${status}`}
            active={activeStatus === status}
          />
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          {activeStatus
            ? `No ${REPORT_STATUS_LABELS[activeStatus].toLowerCase()} reports.`
            : "You haven't started any weekly reports yet."}
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sorted.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/reports/${item.id}`}
                className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {formatWeekRange(item.week_start_date, item.week_end_date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {projectNames[item.project_id] ?? "Unknown project"}
                    {item.version_count > 0
                      ? ` · revision ${item.version_count + 1}`
                      : ""}
                  </div>
                  {item.status === "NEEDS_CORRECTION" &&
                  item.latest_review_comment ? (
                    <p className="max-w-xl text-sm text-amber-700 dark:text-amber-400">
                      “{item.latest_review_comment.comment}”
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">
                    Updated {formatDateTime(item.updated_at)}
                  </span>
                  <ReportStatusBadge status={item.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
