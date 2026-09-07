import { AlertCircle } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { getProjects } from "@/lib/projects";
import { getTeamReports } from "@/lib/reports";
import { getUser } from "@/lib/users";
import { requireRole } from "@/lib/session";
import { MANAGER_ROLES } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewsQueue } from "@/components/reviews-queue";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        {hint}
      </CardContent>
    </Card>
  );
}

/**
 * Manager view of one team member: their full report history plus a handful
 * of basic stats (assignment section 7, "Team member profile page"). Reached
 * by clicking a team member from the team dashboard or the admin team list.
 * Guarded by `reviews/layout.tsx` for every `/reviews/*` route, and re-checked
 * here since it also reads the member's own user record.
 */
export default async function TeamMemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole(MANAGER_ROLES, "/reviews");
  const { userId } = await params;

  const [userResult, reportsResult, projectsResult] = await Promise.all([
    getUser(userId),
    getTeamReports({ userId, pageSize: 200 }),
    getProjects(),
  ]);

  if ("error" in userResult) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load this team member</AlertTitle>
          <AlertDescription>{userResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const member = userResult.data;

  const projectNames: Record<string, string> = {};
  if ("data" in projectsResult) {
    for (const project of projectsResult.data) {
      projectNames[project.id] = project.name;
    }
  }

  const items = "data" in reportsResult ? reportsResult.data.items : [];
  const total = "data" in reportsResult ? reportsResult.data.total : 0;
  const approved = items.filter((r) => r.status === "APPROVED").length;
  const needsCorrection = items.filter(
    (r) => r.status === "NEEDS_CORRECTION"
  ).length;
  const submitted = items.filter((r) => r.status === "SUBMITTED").length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const lastActivity = items.reduce<string | null>((latest, item) => {
    const at = item.submitted_at ?? item.updated_at;
    return !latest || at > latest ? at : latest;
  }, null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{member.name}</h1>
        <p className="text-muted-foreground">
          {member.email} · {member.role}
          {member.status === "disabled" ? " · Disabled account" : ""}
        </p>
      </div>

      {"error" in reportsResult ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load this member&apos;s reports</AlertTitle>
          <AlertDescription>{reportsResult.error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Reports submitted"
              value={String(total)}
              hint="all-time, excluding private drafts"
            />
            <Metric
              label="Approved"
              value={String(approved)}
              hint={`${approvalRate}% approval rate`}
            />
            <Metric
              label="Needs correction"
              value={String(needsCorrection)}
              hint="currently awaiting re-submission"
            />
            <Metric
              label="Awaiting review"
              value={String(submitted)}
              hint="submitted, not yet reviewed"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report history</CardTitle>
              <CardDescription>
                {lastActivity
                  ? `Last activity ${formatDateTime(lastActivity)}. `
                  : "No submitted reports yet. "}
                Private drafts aren&apos;t shown here until submitted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsQueue
                items={items}
                memberNames={{ [member.id]: member.name }}
                projectNames={projectNames}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
