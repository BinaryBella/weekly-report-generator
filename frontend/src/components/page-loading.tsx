import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Full-section loading state, used by route-level `loading.tsx` files (shown by
 * Next.js while a page's server data is being fetched) and anywhere a whole
 * panel is waiting on data.
 */
export function PageLoading({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
        className
      )}
    >
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}
