"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Landing page after login — there is nowhere meaningful to go back to. */
const HIDDEN_ON = "/dashboard";

/**
 * Goes to the previous page in history. Rendered once in the authenticated
 * layout so every page carries the same back control in the same place.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === HIDDEN_ON) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
