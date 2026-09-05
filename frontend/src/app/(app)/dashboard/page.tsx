import Link from "next/link";

import { requireUser } from "@/lib/session";
import { isManager } from "@/lib/types";
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
  const canManage = isManager(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          Welcome, {user.name}
        </h1>
        <p className="text-muted-foreground">
          You are signed in as <span className="font-medium">{user.role}</span>.
          {canManage
            ? " Use the Team dashboard and Insights to review the whole team."
            : " Head to My reports to write and submit your weekly report."}
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
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Every report uses the same fixed structure, so your weeks stay
              comparable across the team.
            </p>
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard/reports"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                View your report history
              </Link>
              <Link
                href="/dashboard/reports/new"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Start a new weekly report
              </Link>
            </div>
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manager tools</CardTitle>
              <CardDescription>
                Review the team&apos;s reports, track trends, and manage members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex flex-col gap-1">
                <Link
                  href="/reviews"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open the team dashboard
                </Link>
                <Link
                  href="/reviews/insights"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open visual insights
                </Link>
                <Link
                  href="/admin"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Manage members &amp; roles
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
