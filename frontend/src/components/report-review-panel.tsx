"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { REVIEW_COMMENT_MAX } from "@/lib/report-schema";
import {
  approveReportAction,
  requestChangesAction,
} from "@/lib/review-actions";
import type { ReportStatus } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Manager review controls for a submitted report. A manager can only drive the
 * status and leave a comment here — never the report's content. The actions are
 * live only while the report is SUBMITTED; in any other state this panel just
 * explains why.
 */
export function ReportReviewPanel({
  reportId,
  status,
}: {
  reportId: string;
  status: ReportStatus;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [intent, setIntent] = useState<"approve" | "request" | null>(null);
  const [pending, startTransition] = useTransition();

  if (status !== "SUBMITTED") {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {status === "APPROVED"
            ? "This report has been approved. No further review actions are available."
            : status === "NEEDS_CORRECTION"
              ? "This report has been sent back for correction. It will return here once the team member resubmits it."
              : "Only a submitted report can be reviewed."}
        </AlertDescription>
      </Alert>
    );
  }

  function approve() {
    setError(null);
    setIntent("approve");
    startTransition(async () => {
      const res = await approveReportAction(reportId);
      setApproveOpen(false);
      if (!res.ok) {
        setError(res.error ?? "Could not approve the report.");
        setIntent(null);
        return;
      }
      router.refresh();
    });
  }

  function requestChanges() {
    setError(null);
    setCommentError(undefined);
    if (!comment.trim()) {
      setCommentError("Explain what needs to change before sending it back.");
      return;
    }
    setIntent("request");
    startTransition(async () => {
      const res = await requestChangesAction(reportId, comment);
      if (!res.ok) {
        setCommentError(res.fieldErrors?.comment);
        setError(res.fieldErrors ? null : res.error ?? "Could not send the report back.");
        setIntent(null);
        return;
      }
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="review-comment">Request changes</Label>
        <Textarea
          id="review-comment"
          rows={4}
          value={comment}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder="One general comment describing what needs to change. The team member will see this on their report."
          onChange={(e) => setComment(e.target.value)}
        />
        <FieldError message={commentError} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={requestChanges}
        >
          {pending && intent === "request" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Send back for correction
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() => setApproveOpen(true)}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve report
        </Button>
      </div>

      <AlertDialog
        open={approveOpen}
        onOpenChange={(open) => !open && !pending && setApproveOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this report?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving marks the report as final. No further edits are expected
              and it can&apos;t be sent back for correction afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={approve} disabled={pending}>
              {pending && intent === "approve" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
