"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { REVIEW_COMMENT_MAX } from "@/lib/report-schema";
import {
  approveReportAction,
  requestChangesAction,
} from "@/lib/review-actions";
import type { ReportStatus } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COMMENT_REQUIRED =
  "Please provide a comment explaining what needs to be corrected.";

/**
 * Manager review controls for a submitted report. A manager can only drive the
 * status and leave a comment here — never the report's content. The actions are
 * live only while the report is SUBMITTED; in any other state this panel just
 * explains why.
 *
 * Both actions ask for confirmation first. "Request changes" additionally
 * requires a non-empty comment before the confirmation can even open.
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
  const [requestOpen, setRequestOpen] = useState(false);
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

  function openRequestChanges() {
    setError(null);
    if (!comment.trim()) {
      setCommentError(COMMENT_REQUIRED);
      toast.error(COMMENT_REQUIRED);
      return;
    }
    setCommentError(undefined);
    setRequestOpen(true);
  }

  function approve() {
    setError(null);
    setIntent("approve");
    startTransition(async () => {
      const res = await approveReportAction(reportId);
      setApproveOpen(false);
      if (!res.ok) {
        const message = res.error ?? "Could not approve the report.";
        setError(message);
        toast.error(message);
        setIntent(null);
        return;
      }
      toast.success("Report approved successfully.");
      router.refresh();
    });
  }

  function requestChanges() {
    setError(null);
    setIntent("request");
    startTransition(async () => {
      const res = await requestChangesAction(reportId, comment);
      setRequestOpen(false);
      if (!res.ok) {
        const fieldMessage = res.fieldErrors?.comment;
        const message =
          fieldMessage ?? res.error ?? "Could not send the report back.";
        setCommentError(fieldMessage);
        setError(fieldMessage ? null : message);
        toast.error(message);
        setIntent(null);
        return;
      }
      toast.success("Report sent back for correction.");
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
        <Label htmlFor="review-comment">
          Correction comment{" "}
          <span className="font-normal text-muted-foreground">
            (required to request changes)
          </span>
        </Label>
        <Textarea
          id="review-comment"
          rows={4}
          value={comment}
          maxLength={REVIEW_COMMENT_MAX}
          aria-invalid={commentError ? true : undefined}
          aria-describedby={commentError ? "review-comment-error" : undefined}
          placeholder="One general comment describing what needs to change. The team member will see this on their report."
          onChange={(e) => {
            setComment(e.target.value);
            if (commentError) setCommentError(undefined);
          }}
        />
        <FieldError id="review-comment-error" message={commentError} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={openRequestChanges}
        >
          {pending && intent === "request" ? (
            <Spinner size="sm" className="mr-2" />
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

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve this report?"
        description="Approving marks the report as final. No further edits are expected and it can't be sent back for correction afterwards."
        confirmLabel="Approve"
        pendingLabel="Approving…"
        pending={pending && intent === "approve"}
        onConfirm={approve}
      />

      <ConfirmDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        title="Send this report back for correction?"
        description="The team member will see your comment and can edit and resubmit the report."
        confirmLabel="Send back"
        pendingLabel="Sending…"
        pending={pending && intent === "request"}
        onConfirm={requestChanges}
      />
    </div>
  );
}
