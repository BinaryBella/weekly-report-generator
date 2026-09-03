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
  const me = await requireRole(MANAGER_ROLES, "/admin");
  const result = await fetchUsers();
  const canEditRoles = me.role === "Admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team &amp; roles</h1>
        <p className="text-muted-foreground">
          {canEditRoles
            ? "Assign roles to control who can review reports across the team."
            : "You can view the team roster. Only an Admin can change roles."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team members</CardTitle>
          <CardDescription>
            Roles: Team Member (own reports) · Manager / Admin (review all
            reports).
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
              canEditRoles={canEditRoles}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
