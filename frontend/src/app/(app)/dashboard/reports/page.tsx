import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";

import { getProjects } from "@/lib/projects";
import { getMyReports } from "@/lib/reports";
import { requireUser } from "@/lib/session";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReportsHistory } from "@/components/reports-history";

export const dynamic = "force-dynamic";

function parseStatus(
  value: string | string[] | undefined
): ReportStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return REPORT_STATUSES.includes(raw as ReportStatus)
    ? (raw as ReportStatus)
    : undefined;
}

export default async function ReportsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireUser("/dashboard/reports");
  const { status: statusParam } = await searchParams;
  const status = parseStatus(statusParam);

  const [reportsResult, projectsResult] = await Promise.all([
    getMyReports({ status }),
    getProjects(),
  ]);

  const projectNames: Record<string, string> = {};
  if ("data" in projectsResult) {
    for (const project of projectsResult.data) {
      projectNames[project.id] = project.name;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Your weekly reports
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and submit your weekly reports. Every report uses the
            same fixed structure so they stay comparable across the team.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/new">
            <Plus className="mr-2 h-4 w-4" />
            New report
          </Link>
        </Button>
      </div>

      {"error" in reportsResult ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load your reports</AlertTitle>
          <AlertDescription>{reportsResult.error}</AlertDescription>
        </Alert>
      ) : (
        <ReportsHistory
          items={reportsResult.data.items}
          projectNames={projectNames}
          activeStatus={status}
        />
      )}
    </div>
  );
}
