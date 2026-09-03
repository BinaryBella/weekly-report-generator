import Link from "next/link";

import { formatDateTime, formatWeekRange } from "@/lib/format";
import type { ReportListItem } from "@/lib/types";
import { ReportStatusBadge } from "@/components/report-status-badge";

/** Sort newest submitted first, falling back to most recently updated. */
function bySubmittedDesc(a: ReportListItem, b: ReportListItem): number {
  const aKey = a.submitted_at ?? a.updated_at;
  const bKey = b.submitted_at ?? b.updated_at;
  return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
}

/**
 * The manager's review list: every team member's report that has left DRAFT,
 * each row showing whose it is, which week, and its current status.
 */
export function ReviewsQueue({
  items,
  memberNames,
  projectNames,
}: {
  items: ReportListItem[];
  memberNames: Record<string, string>;
  projectNames: Record<string, string>;
}) {
  const sorted = [...items].sort(bySubmittedDesc);

  if (sorted.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No reports match this filter.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {sorted.map((item) => (
        <li key={item.id}>
          <Link
            href={`/reviews/${item.id}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5">
              <div className="font-medium">
                {memberNames[item.user_id] ?? "Unknown team member"}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatWeekRange(item.week_start_date, item.week_end_date)} ·{" "}
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
                {item.submitted_at
                  ? `Submitted ${formatDateTime(item.submitted_at)}`
                  : `Updated ${formatDateTime(item.updated_at)}`}
              </span>
              <ReportStatusBadge status={item.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
