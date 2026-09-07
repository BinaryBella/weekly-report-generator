import { AlertCircle } from "lucide-react";

import { getManagerInsights, TREND_WEEKS, type ManagerInsights } from "@/lib/dashboard";
import { formatDate, mostRecentMonday } from "@/lib/format";
import { getProjects } from "@/lib/projects";
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
import { InsightsActivityFeed } from "@/components/insights-activity-feed";
import {
  MemberStatusChart,
  ProjectWorkloadChart,
  SubmissionTrendChart,
  TaskTypeHoursChart,
  TasksTrendChart,
} from "@/components/insights-charts";
import { InsightsControls } from "@/components/insights-controls";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

function validDate(value: string | string[] | undefined): string | undefined {
  const raw = first(value);
  return raw && ISO_DATE.test(raw) ? raw : undefined;
}

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

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type SearchParams = {
  week?: string | string[];
  project_id?: string | string[];
};

export default async function InsightsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(MANAGER_ROLES, "/reviews/insights");
  const sp = await searchParams;

  const week = validDate(sp.week) ?? mostRecentMonday();
  const projectId = first(sp.project_id);

  const [insightsResult, projectsResult] = await Promise.all([
    getManagerInsights({ weekStart: week, projectId }),
    getProjects(),
  ]);

  const projectOptions =
    "data" in projectsResult
      ? projectsResult.data.map((p) => ({ id: p.id, name: p.name }))
      : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">
          Dashboard &amp; insights
        </h1>
        <p className="text-muted-foreground">
          Team-wide metrics for the week of {formatDate(week)}. Trends cover the{" "}
          {TREND_WEEKS} weeks ending that week.
        </p>
      </div>

      <InsightsControls
        week={week}
        projectId={projectId}
        projects={projectOptions}
      />

      {"error" in insightsResult ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load the dashboard</AlertTitle>
          <AlertDescription>{insightsResult.error}</AlertDescription>
        </Alert>
      ) : (
        <Insights data={insightsResult.data} />
      )}
    </div>
  );
}

function Insights({ data }: { data: ManagerInsights }) {
  const { metrics } = data;
  const compliancePct = Math.round(metrics.complianceRate * 100);

  return (
    <div className="space-y-6">
      {data.partialErrors.length > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some panels are showing partial data</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {data.partialErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Summary metrics -------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Submitted this week"
          value={`${metrics.submittedThisWeek} / ${metrics.totalMembers}`}
          hint={`${metrics.totalMembers} team member${
            metrics.totalMembers === 1 ? "" : "s"
          } in scope`}
        />
        <Metric
          label="Submission compliance"
          value={`${compliancePct}%`}
          hint={`${metrics.onTime} on time · ${metrics.late} late · ${metrics.pending} pending`}
        />
        <Metric
          label="Needs correction"
          value={String(metrics.needsCorrection)}
          hint="awaiting re-submission, all weeks"
        />
        <Metric
          label="Open blockers"
          value={String(metrics.openBlockers)}
          hint="flagged across the team this week"
        />
      </div>

      {/* Visual insights ---------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tasks completed trend"
          description="Completed tasks per week, team-wide, with all logged tasks for context."
        >
          <TasksTrendChart data={data.tasksTrend} />
        </ChartCard>

        <ChartCard
          title="Submission status over time"
          description="On-time vs late submissions vs members who didn't submit, per week."
        >
          <SubmissionTrendChart data={data.submissionTrend} />
        </ChartCard>

        <ChartCard
          title="Status by team member"
          description={`Each member's report outcomes over the last ${TREND_WEEKS} weeks.`}
        >
          <MemberStatusChart data={data.memberStatus} />
        </ChartCard>

        <ChartCard
          title="Workload by project"
          description="Completed-task volume per project across the trend window."
        >
          <ProjectWorkloadChart data={data.projectWorkload} />
        </ChartCard>

        <ChartCard
          title="Time spent by task type"
          description="Team-wide hours breakdown (Development, Testing, Meetings, …)."
        >
          <TaskTypeHoursChart data={data.taskTypeHours} />
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>
              Latest submissions and review actions across the team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InsightsActivityFeed items={data.activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
