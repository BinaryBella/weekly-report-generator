"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";

import { assignProjectMembersAction } from "@/lib/project-actions";
import type { Project, User } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Assign / unassign team members on a project. Backed by
 * `PUT /projects/{id}/members`, which replaces the whole member list, so this
 * dialog sends the full current selection on save.
 */
export function ProjectMembersDialog({
  project,
  assignableUsers,
  usersError,
  open,
  onOpenChange,
  onSaved,
}: {
  project: Project;
  assignableUsers: User[];
  usersError?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (project: Project, message: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(project.member_ids)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-seed the selection whenever the dialog is (re)opened for a project.
  useEffect(() => {
    if (open) {
      setSelected(new Set(project.member_ids));
      setError(null);
    }
  }, [open, project]);

  const activeUsers = useMemo(
    () => assignableUsers.filter((user) => user.status === "active"),
    [assignableUsers]
  );

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await assignProjectMembersAction(
        project.id,
        Array.from(selected)
      );
      if (!res.ok || !res.project) {
        setError(res.error ?? "Could not update the members.");
        return;
      }
      onSaved(
        res.project,
        `Updated the team on "${res.project.name}".`
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign team members</DialogTitle>
          <DialogDescription>
            Choose who is on <span className="font-medium">{project.name}</span>.
            Saving replaces the current list.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {usersError ? (
          <p className="text-sm text-destructive">{usersError}</p>
        ) : activeUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active team members to assign.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-1">
            {activeUsers.map((user) => {
              const checked = selected.has(user.id);
              return (
                <li key={user.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 hover:bg-accent">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={checked}
                      onChange={() => toggle(user.id)}
                      disabled={pending}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email} · {user.role}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={pending || Boolean(usersError)}
          >
            {pending ? (
              <Spinner size="sm" className="mr-2" />
            ) : null}
            {pending ? "Saving…" : "Save members"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
