"use client";

import { useMemo } from "react";
import Link from "next/link";

import { formatDate, formatDateTime } from "@/lib/format";
import {
  TEAM_REPORT_STATUS_LABELS,
  TEAM_STATUS_ORDER,
  type TeamStatusResponse,
} from "@/lib/types";
import { usePagedList } from "@/hooks/use-paged-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPagination } from "@/components/ui/list-pagination";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamStatusBadge } from "@/components/team-status-badge";

/**
 * Submission tracking for one week: a tally per status (including members who
 * have not started), then one searchable, paged row per team member.
 */
export function TeamWeekStatus({ data }: { data: TeamStatusResponse }) {
  const rows = useMemo(
    () => [...data.rows].sort((a, b) => a.user_name.localeCompare(b.user_name)),
    [data.rows]
  );
  const list = usePagedList(
    rows,
    (row) =>
      `${row.user_name} ${row.user_email} ${TEAM_REPORT_STATUS_LABELS[row.status]}`,
    25
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border px-2 py-1">
            <span className="font-semibold">{data.total_members}</span> team
            member{data.total_members === 1 ? "" : "s"}
          </span>
          {TEAM_STATUS_ORDER.map((status) => (
            <span key={status} className="rounded-md border px-2 py-1">
              {TEAM_REPORT_STATUS_LABELS[status]}:{" "}
              <span className="font-semibold">
                {data.status_counts[status] ?? 0}
              </span>
            </span>
          ))}
        </div>
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder="Search team members…"
        />
      </div>

      {list.total === 0 ? (
        <EmptyState
          title={
            list.query
              ? "No team members match your search"
              : "No team members to track for this week"
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last update</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.pageItems.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell>
                      <div className="font-medium">{row.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.user_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TeamStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.updated_at ? formatDateTime(row.updated_at) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.report_id && row.status !== "DRAFT" ? (
                        <Link
                          href={`/reviews/${row.report_id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Open
                        </Link>
                      ) : row.status === "DRAFT" ? (
                        <span className="text-xs text-muted-foreground">
                          Draft — private
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ListPagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            total={list.total}
            rangeStart={list.rangeStart}
            rangeEnd={list.rangeEnd}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            itemLabel="members"
          />
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Week starting {formatDate(data.week_start_date)}. A member&apos;s draft
        stays private until they submit it.
      </p>
    </div>
  );
}
