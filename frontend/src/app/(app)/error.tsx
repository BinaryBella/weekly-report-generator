"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

/**
 * Catches unexpected render/data errors inside the authenticated area. The
 * app header and sidebar (rendered by the layout above) stay in place.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-8">
      <ErrorState onRetry={reset} />
    </div>
  );
}
