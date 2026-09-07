import { formatDateTime } from "@/lib/format";
import { REPORT_STATUS_LABELS, type ReportVersion, type ReviewComment } from "@/lib/types";
import { ReportSections } from "@/components/report-sections";

/**
 * On-demand list of a report's past versions. Each correction cycle
 * (Needs Correction → edited → resubmitted) archives the reviewed content as a
 * new revision; this shows every one alongside the revision currently under
 * review, with its submission timestamp and the manager comment it was made
 * against. Expanding a row reveals that revision's full content.
 */
export function ReportVersionHistory({
  versions,
  reviewComments,
  projectName,
  currentRevision,
}: {
  versions: ReportVersion[];
  reviewComments: ReviewComment[];
  projectName?: string;
  /** Revision number of the content currently shown above this history. */
  currentRevision: number;
}) {
  if (versions.length === 0) return null;

  const ordered = [...versions].sort((a, b) => a.version - b.version);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Version history
      </h2>
      <p className="text-sm text-muted-foreground">
        The content above is revision {currentRevision} (the version currently
        under review). Earlier revisions are kept below — expand any to view it.
      </p>
      <ul className="space-y-2">
        {ordered.map((version) => {
          const comments = reviewComments.filter(
            (comment) => comment.against_version === version.version
          );
          return (
            <li key={version.version} className="rounded-md border">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-3 text-sm">
                  <span className="font-medium">
                    Revision {version.version}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {REPORT_STATUS_LABELS[version.status_at_snapshot]} when
                      archived
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {version.submitted_at
                      ? `submitted ${formatDateTime(version.submitted_at)}`
                      : `archived ${formatDateTime(version.snapshot_at)}`}
                  </span>
                </summary>
                <div className="space-y-4 border-t p-4">
                  {comments.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Comment made against this revision
                      </h3>
                      {comments.map((comment, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm"
                        >
                          <p className="whitespace-pre-wrap">{comment.comment}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {comment.manager_name} ·{" "}
                            {formatDateTime(comment.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <ReportSections content={version} projectName={projectName} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
