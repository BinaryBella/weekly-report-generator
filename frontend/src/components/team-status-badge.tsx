import { cn } from "@/lib/utils";
import { TEAM_REPORT_STATUS_LABELS, type TeamReportStatus } from "@/lib/types";

const STATUS_STYLES: Record<TeamReportStatus, string> = {
  NOT_STARTED: "border-dashed border-border text-muted-foreground",
  DRAFT: "border-border text-muted-foreground",
  SUBMITTED: "border-blue-500/40 text-blue-700 dark:text-blue-400",
  NEEDS_CORRECTION: "border-amber-500/40 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
};

/** Status pill that also covers the dashboard-only `NOT_STARTED` state. */
export function TeamStatusBadge({
  status,
  className,
}: {
  status: TeamReportStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {TEAM_REPORT_STATUS_LABELS[status]}
    </span>
  );
}
