import { AlertCircle } from "lucide-react";

import { getAssignableUsers, getProjects } from "@/lib/projects";
import { getTeamReports } from "@/lib/reports";
import { requireRole } from "@/lib/session";
import { MANAGER_ROLES, type ReportStatus } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReviewsFilters } from "@/components/reviews-filters";
import { ReviewsQueue } from "@/components/reviews-queue";

export const dynamic = "force-dynamic";

// DRAFT is deliberately excluded: a draft is private to its author and never
// reaches the review dashboard.
const REVIEWABLE: ReportStatus[] = ["SUBMITTED", "NEEDS_CORRECTION", "APPROVED"];

function parseStatus(
  value: string | string[] | undefined
): ReportStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return REVIEWABLE.includes(raw as ReportStatus)
    ? (raw as ReportStatus)
    : undefined;
}

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; user_id?: string | string[] }>;
}) {
  await requireRole(MANAGER_ROLES, "/reviews");
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const userId = first(sp.user_id);

  const [reportsResult, usersResult, projectsResult] = await Promise.all([
    getTeamReports({ status, userId }),
    getAssignableUsers(),
    getProjects(),
  ]);

  const memberNames: Record<string, string> = {};
  const members: { id: string; name: string }[] = [];
  if ("data" in usersResult) {
    for (const user of usersResult.data) {
      memberNames[user.id] = user.name;
      if (user.role === "Team Member") members.push({ id: user.id, name: user.name });
    }
    members.sort((a, b) => a.name.localeCompare(b.name));
  }

  const projectNames: Record<string, string> = {};
  if ("data" in projectsResult) {
    for (const project of projectsResult.data) {
      projectNames[project.id] = project.name;
    }
  }

  const awaiting =
    "data" in reportsResult
      ? reportsResult.data.items.filter((r) => r.status === "SUBMITTED").length
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Report reviews</h1>
        <p className="text-muted-foreground">
          Every team member&apos;s submitted reports. Approve a report, or send it
          back with a comment describing what needs to change.
          {awaiting > 0 ? (
            <span className="font-medium text-foreground">
              {" "}
              {awaiting} awaiting review.
            </span>
          ) : null}
        </p>
      </div>

      <ReviewsFilters
        activeStatus={status}
        activeUserId={userId}
        members={members}
      />

      {"error" in reportsResult ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load the review queue</AlertTitle>
          <AlertDescription>{reportsResult.error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <ReviewsQueue
            items={reportsResult.data.items}
            memberNames={memberNames}
            projectNames={projectNames}
          />
          {reportsResult.data.total > reportsResult.data.items.length ? (
            <p className="text-center text-xs text-muted-foreground">
              Showing the {reportsResult.data.items.length} most recent of{" "}
              {reportsResult.data.total}. Narrow the filters to see older reports.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
