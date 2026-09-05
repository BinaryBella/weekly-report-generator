"use client";

import { useMemo } from "react";
import Link from "next/link";

import { formatDate, formatDateTime, formatWeekRange } from "@/lib/format";
import { type ReportListItem, REPORT_STATUS_LABELS } from "@/lib/types";
import { usePagedList } from "@/hooks/use-paged-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPagination } from "@/components/ui/list-pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ReportStatusBadge } from "@/components/report-status-badge";

/** Sort newest submitted first, falling back to most recently updated. */
function bySubmittedDesc(a: ReportListItem, b: ReportListItem): number {
  const aKey = a.submitted_at ?? a.updated_at;
  const bKey = b.submitted_at ?? b.updated_at;
  return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
}

/**
 * The manager's review list: every team member's report that has left DRAFT,
 * each row showing whose it is, which week, and its current status. The
 * server-side dashboard filters narrow the set; this box + pager work on top,
 * client-side.
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
  const sorted = useMemo(() => [...items].sort(bySubmittedDesc), [items]);
  const list = usePagedList(
    sorted,
    (item) =>
      [
        memberNames[item.user_id] ?? "",
        projectNames[item.project_id] ?? "",
        formatWeekRange(item.week_start_date, item.week_end_date),
        formatDate(item.week_start_date),
        REPORT_STATUS_LABELS[item.status],
        item.latest_review_comment?.comment ?? "",
      ].join(" "),
    10
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={list.query}
        onChange={list.setQuery}
        placeholder="Search by member, project, week…"
      />

      {list.total === 0 ? (
        <EmptyState
          title={
            list.query
              ? "No reports match your search"
              : "No reports match these filters"
          }
          description={
            list.query
              ? "Try a different search term."
              : "Adjust the week, team member, project, status, or date range above."
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {list.pageItems.map((item) => (
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
                      {formatWeekRange(
                        item.week_start_date,
                        item.week_end_date
                      )}{" "}
                      · {projectNames[item.project_id] ?? "Unknown project"}
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
          <ListPagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            total={list.total}
            rangeStart={list.rangeStart}
            rangeEnd={list.rangeEnd}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            itemLabel="reports"
          />
        </>
      )}
    </div>
  );
}
