import { AlertCircle } from "lucide-react";

import { getAssignableUsers, getProjects } from "@/lib/projects";
import { getReport } from "@/lib/reports";
import { requireRole } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { MANAGER_ROLES } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportDetailView } from "@/components/report-detail-view";
import { ReportReviewPanel } from "@/components/report-review-panel";
import { ReportStatusBadge } from "@/components/report-status-badge";

export const dynamic = "force-dynamic";

export default async function ReviewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(MANAGER_ROLES, "/reviews");
  const { id } = await params;

  const [reportResult, usersResult, projectsResult] = await Promise.all([
    getReport(id),
    getAssignableUsers(),
    getProjects(),
  ]);

  if ("error" in reportResult) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t open this report</AlertTitle>
          <AlertDescription>{reportResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const report = reportResult.data;
  const projects = "data" in projectsResult ? projectsResult.data : [];
  const projectName =
    projects.find((project) => project.id === report.project_id)?.name ??
    "Unknown project";
  const authorName =
    ("data" in usersResult
      ? usersResult.data.find((user) => user.id === report.user_id)?.name
      : undefined) ?? "Unknown team member";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {authorName}&apos;s weekly report
          </h1>
          <p className="text-sm text-muted-foreground">
            {report.submitted_at
              ? `Submitted ${formatDateTime(report.submitted_at)}`
              : `Updated ${formatDateTime(report.updated_at)}`}
          </p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review</CardTitle>
          <CardDescription>
            You can change the status and leave a comment. The report content is
            the team member&apos;s to edit, not yours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportReviewPanel reportId={report.id} status={report.status} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ReportDetailView report={report} projectName={projectName} />
        </CardContent>
      </Card>
    </div>
  );
}
