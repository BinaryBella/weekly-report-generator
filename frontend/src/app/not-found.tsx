import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border bg-card p-10 text-center">
        <FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Button asChild className="mt-2">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
