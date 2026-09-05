"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { assignRoleAction } from "@/lib/auth-actions";
import { deleteUserAction, updateUserStatusAction } from "@/lib/user-actions";
import { ROLES, type Role, type User } from "@/lib/types";
import { usePagedList } from "@/hooks/use-paged-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InviteUserForm } from "@/components/invite-user-form";
import { ListPagination } from "@/components/ui/list-pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function RoleCell({
  user,
  disabled,
}: {
  user: User;
  disabled: boolean;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(nextRole: string) {
    const target = nextRole as Role;
    if (target === role) return;
    const previous = role;
    setRole(target);
    setError(null);
    startTransition(async () => {
      const res = await assignRoleAction(user.id, target);
      if (!res.ok) {
        setRole(previous);
        const message = res.error ?? "Could not update the role.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(`${user.name} is now ${target}.`);
    });
  }

  if (disabled) {
    return <span className="text-sm">{role}</span>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={onChange} disabled={pending}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pending ? (
          <Spinner size="sm" className="text-muted-foreground" />
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function UsersTable({
  users: initialUsers,
  currentUserId,
  canEditRoles,
}: {
  users: User[];
  currentUserId: string;
  canEditRoles: boolean;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [reveal, setReveal] = useState<{ email: string; password: string } | null>(
    null
  );
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removePending, startRemove] = useTransition();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restorePending, startRestore] = useTransition();

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  const list = usePagedList(
    sorted,
    (u) => `${u.name} ${u.email} ${u.role} ${u.status}`,
    10
  );

  function handleInvited(
    user: User,
    temporaryPassword: string | null,
    emailSent: boolean
  ) {
    setUsers((prev) => [...prev, user]);
    setCreateOpen(false);
    if (emailSent) {
      setReveal(null);
      toast.success(`Invite email sent to ${user.email}.`);
    } else {
      toast.success(`Invited ${user.name}.`);
      if (temporaryPassword) {
        setReveal({ email: user.email, password: temporaryPassword });
      }
    }
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const target = removeTarget;
    startRemove(async () => {
      const res = await deleteUserAction(target.id);
      if (!res.ok) {
        toast.error(res.error ?? "Could not remove the team member.");
        setRemoveTarget(null);
        return;
      }
      if (res.softDeleted) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === target.id ? { ...u, status: "disabled" } : u
          )
        );
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
      }
      toast.success(res.detail ?? `Removed ${target.name}.`);
      setRemoveTarget(null);
    });
  }

  function restore(user: User) {
    setRestoringId(user.id);
    startRestore(async () => {
      const res = await updateUserStatusAction(user.id, "active");
      setRestoringId(null);
      if (!res.ok) {
        toast.error(res.error ?? "Could not restore the account.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "active" } : u))
      );
      toast.success(`${user.name}'s account is active again.`);
    });
  }

  async function copyPassword() {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.password);
      toast.success("Password copied.");
    } catch {
      toast.error("Could not copy — select and copy it manually.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder="Search by name, email, role…"
        />
        {canEditRoles ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite team member
          </Button>
        ) : null}
      </div>

      {reveal ? (
        <Alert className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <AlertTitle>Share these credentials manually</AlertTitle>
            <AlertDescription>
              Email delivery isn&apos;t configured, so {reveal.email} wasn&apos;t
              emailed. Temporary password:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {reveal.password}
              </code>
            </AlertDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReveal(null)}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}

      {list.total === 0 ? (
        <EmptyState
          title={
            users.length === 0
              ? "No team members found"
              : "No team members match your search"
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  {canEditRoles ? (
                    <th className="py-2 pr-4 text-right font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {list.pageItems.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        {user.name}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            user.status === "active"
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          }
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <RoleCell user={user} disabled={!canEditRoles || isSelf} />
                      </td>
                      {canEditRoles ? (
                        <td className="py-3 pr-4 text-right">
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : user.status === "disabled" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={restorePending && restoringId === user.id}
                              onClick={() => restore(user)}
                            >
                              {restorePending && restoringId === user.id ? (
                                <Spinner size="sm" className="mr-2" />
                              ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                              )}
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRemoveTarget(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ListPagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            total={list.total}
            rangeStart={list.rangeStart}
            rangeEnd={list.rangeEnd}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            itemLabel="members"
          />
        </>
      )}

      {canEditRoles ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                Creates their account and emails them the sign-in credentials
                when email is configured — otherwise you&apos;ll get the
                temporary password back here to share yourself.
              </DialogDescription>
            </DialogHeader>
            <InviteUserForm
              onInvited={handleInvited}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {canEditRoles ? (
        <ConfirmDialog
          open={Boolean(removeTarget)}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title={`Remove ${removeTarget?.name ?? ""}?`}
          description="They'll no longer be able to sign in. If they have existing reports or project assignments, the account is disabled instead of deleted so that history stays intact — you can restore access later."
          confirmLabel="Remove"
          pendingLabel="Removing…"
          destructive
          pending={removePending}
          onConfirm={confirmRemove}
        />
      ) : null}
    </div>
  );
}
