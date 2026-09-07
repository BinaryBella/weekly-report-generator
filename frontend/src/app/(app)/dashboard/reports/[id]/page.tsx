import { AlertCircle, CheckCircle2 } from "lucide-react";

import { getProjects } from "@/lib/projects";
import { getReport } from "@/lib/reports";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { isReportEditable } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailView } from "@/components/report-detail-view";
import { ReportForm } from "@/components/report-form";
import { ReportStatusBadge } from "@/components/report-status-badge";
import { ReportVersionHistory } from "@/components/report-version-history";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("/dashboard/reports");
  const { id } = await params;

  const [reportResult, projectsResult] = await Promise.all([
    getReport(id),
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
  const editable = isReportEditable(report.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Weekly report</h1>
          <p className="text-sm text-muted-foreground">
            Last updated {formatDateTime(report.updated_at)}
          </p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>

      {report.status === "NEEDS_CORRECTION" && report.latest_review_comment ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Your manager asked for changes</AlertTitle>
          <AlertDescription>
            <p className="whitespace-pre-wrap">
              {report.latest_review_comment.comment}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.latest_review_comment.manager_name} ·{" "}
              {formatDateTime(report.latest_review_comment.created_at)}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {report.status === "SUBMITTED" ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This report is with your manager for review. You&apos;ll be able to
            edit it again if changes are requested.
          </AlertDescription>
        </Alert>
      ) : null}

      {report.status === "APPROVED" ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            This report was approved
            {report.reviewed_at
              ? ` on ${formatDateTime(report.reviewed_at)}`
              : ""}
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {editable ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {report.status === "NEEDS_CORRECTION"
                  ? "Make corrections"
                  : "Edit draft"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReportForm mode="edit" report={report} projects={projects} />
            </CardContent>
          </Card>

          {report.version_history.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <ReportVersionHistory
                  versions={report.version_history}
                  reviewComments={report.review_comments}
                  projectName={projectName}
                  currentRevision={report.version_history.length + 1}
                />
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ReportDetailView report={report} projectName={projectName} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
