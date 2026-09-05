"use client";

import type { ReactNode } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * The single confirmation dialog for destructive or otherwise important actions
 * — delete a project, submit / resubmit / approve / send back a report, leave a
 * form with unsaved changes. One design, one behaviour everywhere.
 *
 * While `pending` is true the dialog can't be dismissed and the confirm button
 * shows a spinner, so the action can't be fired twice.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Working…",
  onConfirm,
  pending = false,
  destructive = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
  destructive?: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return; // don't let a click-away cancel work in progress
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog open so `pending` can render; the caller closes it.
              event.preventDefault();
              onConfirm();
            }}
            disabled={pending}
            className={cn(
              destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {pending ? <Spinner size="sm" className="mr-2" /> : null}
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
