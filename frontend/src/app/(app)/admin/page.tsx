import { AlertCircle } from "lucide-react";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken, requireRole } from "@/lib/session";
import { MANAGER_ROLES, type User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UsersTable } from "@/components/users-table";

export const dynamic = "force-dynamic";

async function fetchUsers(): Promise<
  { users: User[] } | { error: string }
> {
  const token = await getAccessToken();
  if (!token) return { error: "Your session has expired. Sign in again." };

  const res = await apiFetch("/users/?limit=200", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { error: await readErrorDetail(res, "Could not load users.") };
  }
  return { users: (await res.json()) as User[] };
}

export default async function AdminPage() {
  // Manager-gated by the layout, and Manager is the privileged role, so anyone
  // who reaches this page can assign roles.
  const me = await requireRole(MANAGER_ROLES, "/admin");
  const result = await fetchUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Team &amp; roles</h1>
        <p className="text-muted-foreground">
          Invite team members, assign roles, and remove members who no longer
          need access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team members</CardTitle>
          <CardDescription>
            Roles: Team Member (own reports) · Manager (reviews all reports and
            manages the team). Removing a member with existing reports or
            project assignments disables their account instead of deleting it,
            so that history stays intact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {"error" in result ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Couldn&apos;t load the team</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          ) : (
            <UsersTable
              users={result.users}
              currentUserId={me.id}
              canEditRoles
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
