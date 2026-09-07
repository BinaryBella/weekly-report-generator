"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shared fallback for an unexpected client error, used by every `error.tsx`
 * boundary. Never shows the raw error text to the user — the message is a plain,
 * reassuring sentence and the details go to the console for developers.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this page correctly. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border bg-card p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button type="button" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
