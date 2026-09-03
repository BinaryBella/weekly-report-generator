import { AlertCircle } from "lucide-react";

import { formatDate, mostRecentMonday } from "@/lib/format";
import { getAssignableUsers, getProjects } from "@/lib/projects";
import { REPORT_SECTIONS } from "@/lib/report-schema";
import {
  getTeamReports,
  getTeamSection,
  getTeamWeekStatus,
} from "@/lib/reports";
import { requireRole } from "@/lib/session";
import {
  MANAGER_ROLES,
  type ReportSectionKey,
  type ReportStatus,
} from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewsQueue } from "@/components/reviews-queue";
import {
  SectionPicker,
  TeamReportFilters,
  WeekPicker,
  type DashboardParams,
} from "@/components/team-dashboard-controls";
import { TeamSectionCompare } from "@/components/team-section-compare";
import { TeamWeekStatus } from "@/components/team-week-status";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIST_STATUSES: ReportStatus[] = [
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "APPROVED",
];

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

function validDate(value: string | string[] | undefined): string | undefined {
  const raw = first(value);
  return raw && ISO_DATE.test(raw) ? raw : undefined;
}

type SearchParams = {
  week?: string | string[];
  section?: string | string[];
  status?: string | string[];
  user_id?: string | string[];
  project_id?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

export default async function TeamDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(MANAGER_ROLES, "/reviews");
  const sp = await searchParams;

  const week = validDate(sp.week) ?? mostRecentMonday();
  const sectionRaw = first(sp.section);
  const section = REPORT_SECTIONS.includes(sectionRaw as ReportSectionKey)
    ? (sectionRaw as ReportSectionKey)
    : undefined;
  const statusRaw = first(sp.status);
  const status = LIST_STATUSES.includes(statusRaw as ReportStatus)
    ? (statusRaw as ReportStatus)
    : undefined;
  const userId = first(sp.user_id);
  const projectId = first(sp.project_id);
  const dateFrom = validDate(sp.from);
  const dateTo = validDate(sp.to);

  // The list follows the selected week unless an explicit range is given.
  const useRange = Boolean(dateFrom || dateTo);

  const [statusResult, sectionResult, reportsResult, usersResult, projectsResult] =
    await Promise.all([
      getTeamWeekStatus(week, projectId),
      section ? getTeamSection(week, section, projectId) : Promise.resolve(null),
      getTeamReports({
        status,
        userId,
        projectId,
        weekStartDate: useRange ? undefined : week,
        dateFrom,
        dateTo,
      }),
      getAssignableUsers(),
      getProjects(),
    ]);

  const memberNames: Record<string, string> = {};
  const members: { id: string; name: string }[] = [];
  if ("data" in usersResult) {
    for (const user of usersResult.data) {
      memberNames[user.id] = user.name;
      if (user.role === "Team Member") {
        members.push({ id: user.id, name: user.name });
      }
    }
    members.sort((a, b) => a.name.localeCompare(b.name));
  }

  const projectNames: Record<string, string> = {};
  const projectOptions: { id: string; name: string }[] = [];
  if ("data" in projectsResult) {
    for (const project of projectsResult.data) {
      projectNames[project.id] = project.name;
      projectOptions.push({ id: project.id, name: project.name });
    }
  }

  const params: DashboardParams = {
    week,
    section,
    status,
    user_id: userId,
    project_id: projectId,
    from: dateFrom,
    to: dateTo,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Team dashboard</h1>
        <p className="text-muted-foreground">
          Track every team member&apos;s reports for a week, compare a section
          across the team, and open any report to approve it or request changes.
        </p>
      </div>

      {/* Submission status per team member, for the selected week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Submission status — week of {formatDate(week)}
          </CardTitle>
          <CardDescription>
            One row per team member, including anyone who hasn&apos;t started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeekPicker params={params} />
          {"error" in statusResult ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusResult.error}</AlertDescription>
            </Alert>
          ) : (
            <TeamWeekStatus data={statusResult.data} />
          )}
        </CardContent>
      </Card>

      {/* One section across the whole team (bonus) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compare a section</CardTitle>
          <CardDescription>
            View one section (blockers, achievements, …) for every team member
            side by side for the selected week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionPicker params={params} />
          {!section ? (
            <p className="text-sm text-muted-foreground">
              Choose a section above to line it up across the team.
            </p>
          ) : sectionResult && "error" in sectionResult ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sectionResult.error}</AlertDescription>
            </Alert>
          ) : sectionResult ? (
            <TeamSectionCompare data={sectionResult.data} />
          ) : null}
        </CardContent>
      </Card>

      {/* Filterable list of all team reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All reports</CardTitle>
          <CardDescription>
            {useRange
              ? "Filtered by the date range below."
              : `Showing the week of ${formatDate(week)}. Set a date range to widen it.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeamReportFilters
            params={params}
            members={members}
            projects={projectOptions}
          />
          {"error" in reportsResult ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Couldn&apos;t load the reports</AlertTitle>
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
                  Showing {reportsResult.data.items.length} of{" "}
                  {reportsResult.data.total}. Narrow the filters to see the rest.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
