import { cn } from "@/lib/utils";
import { REPORT_STATUS_LABELS, type ReportStatus } from "@/lib/types";

const STATUS_STYLES: Record<ReportStatus, string> = {
  DRAFT: "border-border text-muted-foreground",
  SUBMITTED: "border-blue-500/40 text-blue-700 dark:text-blue-400",
  NEEDS_CORRECTION: "border-amber-500/40 text-amber-700 dark:text-amber-400",
  APPROVED: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
};

/** Pill showing a report's lifecycle state, styled like the project status badge. */
export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
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
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
