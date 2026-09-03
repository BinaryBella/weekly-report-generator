"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { deleteProjectAction } from "@/lib/project-actions";
import type { Project, User } from "@/lib/types";
import { cn } from "@/lib/utils";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectForm } from "@/components/project-form";
import { ProjectMembersDialog } from "@/components/project-members-dialog";

type Feedback = { type: "success" | "error"; message: string };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        active
          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
          : "border-border text-muted-foreground"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ProjectsManager({
  projects,
  canManage,
  assignableUsers,
  usersError,
}: {
  projects: Project[];
  canManage: boolean;
  assignableUsers: User[];
  usersError?: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [managingMembers, setManagingMembers] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deletePending, startDelete] = useTransition();

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startDelete(async () => {
      const res = await deleteProjectAction(target.id);
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: res.error ?? "Could not delete the project.",
        });
      } else {
        setFeedback({
          type: "success",
          message:
            res.result?.detail ??
            (res.result?.soft_deleted
              ? `"${target.name}" is in use by reports, so it was deactivated.`
              : `Deleted "${target.name}".`),
        });
      }
      setDeleteTarget(null);
    });
  }

  const colSpan = canManage ? 5 : 4;

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        </div>
      ) : null}

      {feedback ? (
        <Alert variant={feedback.type === "success" ? "success" : "destructive"}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="flex items-start justify-between gap-4">
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              {canManage ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-10 text-center text-muted-foreground"
                >
                  {canManage
                    ? 'No projects yet. Use "Add project" to create the first one.'
                    : "No projects have been created yet."}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {project.description ? (
                      <span className="line-clamp-2">{project.description}</span>
                    ) : (
                      <span aria-hidden>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setManagingMembers(project)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {project.member_ids.length}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">
                        {project.member_ids.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={project.is_active} />
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(project)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create ------------------------------------------------------------- */}
      {canManage ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project / category</DialogTitle>
              <DialogDescription>
                Create a project that team members can file report entries
                under.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              onSuccess={(project) => {
                setCreateOpen(false);
                setFeedback({
                  type: "success",
                  message: `Created "${project.name}".`,
                });
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Edit ------------------------------------------------------------- */}
      {canManage && editing ? (
        <Dialog
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit project / category</DialogTitle>
              <DialogDescription>
                Update the details for{" "}
                <span className="font-medium">{editing.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              project={editing}
              onSuccess={(project) => {
                setEditing(null);
                setFeedback({
                  type: "success",
                  message: `Saved changes to "${project.name}".`,
                });
              }}
              onCancel={() => setEditing(null)}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Members ------------------------------------------------------------- */}
      {canManage && managingMembers ? (
        <ProjectMembersDialog
          project={managingMembers}
          assignableUsers={assignableUsers}
          usersError={usersError}
          open={Boolean(managingMembers)}
          onOpenChange={(open) => !open && setManagingMembers(null)}
          onSaved={(_project, message) => {
            setManagingMembers(null);
            setFeedback({ type: "success", message });
          }}
        />
      ) : null}

      {/* Delete confirm --------------------------------------------------- */}
      {canManage ? (
        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && !deletePending && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &quot;{deleteTarget?.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This removes the project. If any report entries already
                reference it, it is deactivated instead of deleted so past
                reports stay intact. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deletePending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : null}
                {deletePending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
