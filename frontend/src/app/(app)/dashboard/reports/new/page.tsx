import { getProjects } from "@/lib/projects";
import { requireUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportForm } from "@/components/report-form";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  await requireUser("/dashboard/reports/new");

  // Only live projects can be filed against on a new report.
  const projectsResult = await getProjects(true);
  const projects = "data" in projectsResult ? projectsResult.data : [];
  const projectsError =
    "error" in projectsResult ? projectsResult.error : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">New weekly report</h1>
        <p className="text-muted-foreground">
          Fill in the report structure below. Save it as a draft to finish later,
          or submit it for manager review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report</CardTitle>
          <CardDescription>
            The same fields, in the same order, for everyone on the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm
            mode="create"
            projects={projects}
            projectsError={projectsError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
