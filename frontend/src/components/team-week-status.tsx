import Link from "next/link";

import { formatDate, formatDateTime } from "@/lib/format";
import {
  TEAM_REPORT_STATUS_LABELS,
  TEAM_STATUS_ORDER,
  type TeamStatusResponse,
} from "@/lib/types";
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
 * have not started), then one row per team member with their status and a link
 * into the report when one exists.
 */
export function TeamWeekStatus({ data }: { data: TeamStatusResponse }) {
  const rows = [...data.rows].sort((a, b) =>
    a.user_name.localeCompare(b.user_name)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border px-2 py-1">
          <span className="font-semibold">{data.total_members}</span> team member
          {data.total_members === 1 ? "" : "s"}
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  No team members to track for this week.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Week starting {formatDate(data.week_start_date)}. A member&apos;s draft
        stays private until they submit it.
      </p>
    </div>
  );
}
