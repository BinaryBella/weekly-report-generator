import Link from "next/link";

import { requireUser } from "@/lib/session";
import { getProjects } from "@/lib/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportEntryForm } from "@/components/report-entry-form";

export const dynamic = "force-dynamic";

export default async function NewReportEntryPage() {
  await requireUser("/dashboard/reports/new");

  // Only live projects can be filed against.
  const projectsResult = await getProjects(true);
  const projects = "data" in projectsResult ? projectsResult.data : [];
  const projectsError =
    "error" in projectsResult ? projectsResult.error : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New report entry</h1>
        <p className="text-muted-foreground">
          Start a draft weekly report and file it under a project / category.{" "}
          <Link
            href="/dashboard"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report details</CardTitle>
          <CardDescription>
            The report is saved as a draft you can finish later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportEntryForm projects={projects} projectsError={projectsError} />
        </CardContent>
      </Card>
    </div>
  );
}
