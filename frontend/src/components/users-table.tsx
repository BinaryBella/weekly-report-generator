"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { assignRoleAction } from "@/lib/auth-actions";
import { ROLES, type Role, type User } from "@/lib/types";
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
        setError(res.error ?? "Could not update the role.");
      }
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
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function UsersTable({
  users,
  currentUserId,
  canEditRoles,
}: {
  users: User[];
  currentUserId: string;
  canEditRoles: boolean;
}) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No users found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
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
                  <RoleCell
                    user={user}
                    disabled={!canEditRoles || isSelf}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
