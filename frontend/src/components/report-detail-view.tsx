import { formatDateTime } from "@/lib/format";
import type { Report } from "@/lib/types";
import { ReportSections, Section } from "@/components/report-sections";
import { ReportVersionHistory } from "@/components/report-version-history";

/**
 * Full read-only rendering of a report: the manager's review-comment history,
 * every section of the fixed structure in order, and — on demand — each past
 * version of that week's report. Used by both the team member (once their
 * report has been submitted) and the manager (who never edits the content).
 */
export function ReportDetailView({
  report,
  projectName,
}: {
  report: Report;
  projectName: string;
}) {
  const currentRevision = report.version_history.length + 1;

  return (
    <div className="space-y-8">
      {report.review_comments.length > 0 ? (
        <Section title="Manager review history">
          <ul className="space-y-2">
            {report.review_comments.map((comment, i) => (
              <li
                key={i}
                className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3"
              >
                <p className="whitespace-pre-wrap">{comment.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {comment.manager_name} · {formatDateTime(comment.created_at)} ·
                  against revision {comment.against_version}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ReportSections content={report} projectName={projectName} />

      <ReportVersionHistory
        versions={report.version_history}
        reviewComments={report.review_comments}
        projectName={projectName}
        currentRevision={currentRevision}
      />
    </div>
  );
}
