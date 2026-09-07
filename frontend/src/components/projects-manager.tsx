"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteProjectAction } from "@/lib/project-actions";
import type { Project, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/use-paged-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPagination } from "@/components/ui/list-pagination";
import { SearchInput } from "@/components/ui/search-input";
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
  const [deletePending, startDelete] = useTransition();

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );
  const list = usePagedList(
    sortedProjects,
    (p) => `${p.name} ${p.description ?? ""} ${p.is_active ? "active" : "inactive"}`,
    10
  );

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startDelete(async () => {
      const res = await deleteProjectAction(target.id);
      if (!res.ok) {
        toast.error(res.error ?? "Could not delete the project.");
      } else if (res.result?.soft_deleted) {
        toast.success(
          `"${target.name}" is in use by reports, so it was deactivated.`
        );
      } else {
        toast.success(`Deleted "${target.name}".`);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder="Search projects…"
        />
        {canManage ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        ) : null}
      </div>

      {list.total === 0 ? (
        <EmptyState
          title={
            list.query
              ? "No projects match your search"
              : "No projects yet"
          }
          description={
            list.query
              ? "Try a different search term."
              : canManage
                ? 'Use "Add project" to create the first one.'
                : "No projects have been created yet."
          }
        />
      ) : (
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
            {list.pageItems.map((project) => (
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
              ))}
          </TableBody>
        </Table>
        </div>
      )}

      {list.total > 0 ? (
        <ListPagination
          page={list.page}
          pageCount={list.pageCount}
          pageSize={list.pageSize}
          total={list.total}
          rangeStart={list.rangeStart}
          rangeEnd={list.rangeEnd}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          itemLabel="projects"
        />
      ) : null}

      {/* Create ------------------------------------------------------------- */}
      {canManage ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Create a project that team members can file report entries
                under.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              onSuccess={(project) => {
                setCreateOpen(false);
                toast.success(`Created "${project.name}".`);
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
              <DialogTitle>Edit project</DialogTitle>
              <DialogDescription>
                Update the details for{" "}
                <span className="font-medium">{editing.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              project={editing}
              onSuccess={(project) => {
                setEditing(null);
                toast.success(`Saved changes to "${project.name}".`);
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
            toast.success(message);
          }}
        />
      ) : null}

      {/* Delete confirm --------------------------------------------------- */}
      {canManage ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={`Delete "${deleteTarget?.name ?? ""}"?`}
          description="This removes the project. If any report entries already reference it, it is deactivated instead of deleted so past reports stay intact. This cannot be undone."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          destructive
          pending={deletePending}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}
