"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

/** Root-level fallback for errors thrown outside the authenticated layout. */
export default function RootError({
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
    <div className="flex min-h-screen items-center justify-center p-6">
      <ErrorState onRetry={reset} />
    </div>
  );
}
