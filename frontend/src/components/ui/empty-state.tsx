import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The one "nothing here yet" panel used across the app — report lists, the team
 * dashboard, project and user tables, activity feeds. Keeps every empty view on
 * the same border, spacing, and typography.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-10 text-center",
        className
      )}
    >
      {Icon ? (
        <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden />
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
