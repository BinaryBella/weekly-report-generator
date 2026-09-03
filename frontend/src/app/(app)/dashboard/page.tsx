import { requireUser } from "@/lib/session";
import { isManagerOrAdmin } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const canManage = isManagerOrAdmin(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          You are signed in as <span className="font-medium">{user.role}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your weekly reports</CardTitle>
            <CardDescription>
              Create, edit, and submit your own weekly reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The reports workspace is delivered in a separate section.
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team overview</CardTitle>
              <CardDescription>
                Review submitted reports and manage team members.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Head to the <span className="font-medium">Admin</span> area to
              manage roles.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
