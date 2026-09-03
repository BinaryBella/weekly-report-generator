import Link from "next/link";
import { CheckCircle2, RotateCcw, Send, Undo2 } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import type { ActivityItem, ActivityKind } from "@/lib/dashboard";

/**
 * Recent reports / review actions across the team — submissions, resubmissions,
 * approvals, and send-backs — newest first. Each row links to the manager review
 * page for that report.
 */

const KIND_META: Record<
  ActivityKind,
  { verb: string; Icon: typeof CheckCircle2; className: string }
> = {
  submitted: {
    verb: "submitted their report",
    Icon: Send,
    className: "text-blue-600 dark:text-blue-400",
  },
  resubmitted: {
    verb: "resubmitted their report",
    Icon: RotateCcw,
    className: "text-blue-600 dark:text-blue-400",
  },
  approved: {
    verb: "report was approved",
    Icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  needs_correction: {
    verb: "report was sent back for correction",
    Icon: Undo2,
    className: "text-amber-600 dark:text-amber-400",
  },
};

export function InsightsActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No submissions or review actions yet.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((item) => {
        const meta = KIND_META[item.kind];
        const { Icon } = meta;
        return (
          <li key={`${item.id}-${item.kind}-${item.at}`}>
            <Link
              href={`/reviews/${item.id}`}
              className="flex gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm">
                  <span className="font-medium">{item.member}</span> — {meta.verb}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.project} · week of {item.weekLabel} ·{" "}
                  {formatDateTime(item.at)}
                </p>
                {item.comment ? (
                  <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-amber-700 dark:text-amber-400">
                    “{item.comment}”
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
