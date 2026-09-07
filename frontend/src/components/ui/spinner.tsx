import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export type SpinnerSize = keyof typeof SIZES;

/**
 * Decorative spinning indicator. Purely visual (`aria-hidden`) — wrap it in an
 * element with `role="status"` and a text label when it stands alone, or drop it
 * inside a button that already sets `aria-busy` (see {@link PageLoading} and
 * `SubmitButton`).
 *
 * Colour is inherited (`currentColor`); pass a text-colour class to override.
 */
export function Spinner({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <Loader2
      aria-hidden="true"
      focusable="false"
      className={cn("animate-spin", SIZES[size], className)}
    />
  );
}
