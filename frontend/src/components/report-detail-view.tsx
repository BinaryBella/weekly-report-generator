import type { ReactNode } from "react";

import { formatDateTime, formatWeekRange } from "@/lib/format";
import {
  HOURS_TYPES,
  HOURS_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/report-schema";
import type { Report, ReportVersion } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Read-only rendering of a report, used once it has been submitted (and can no
 * longer be edited). Shows every section of the fixed structure in order, plus
 * the manager's review history and any past versions.
 */
export function ReportDetailView({
  report,
  projectName,
}: {
  report: Report;
  projectName: string;
}) {
  const hours = report.hours_worked_breakdown;
  const totalHours = hours
    ? HOURS_TYPES.reduce((sum, key) => sum + hours[key], 0)
    : 0;

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

      <Section title="Week / date range">
        <p>{formatWeekRange(report.week_start_date, report.week_end_date)}</p>
      </Section>

      <Section title="Project / category">
        <p>{projectName}</p>
      </Section>

      <Section title="Tasks completed">
        {report.tasks_completed.length === 0 ? (
          <Empty>No tasks recorded.</Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Planned % / Actual %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time planned / spent (h)</TableHead>
                  <TableHead>Output / deliverable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.tasks_completed.map((task, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {task.task_name}
                    </TableCell>
                    <TableCell>{TASK_PRIORITY_LABELS[task.priority]}</TableCell>
                    <TableCell>
                      {task.planned_percentage}% / {task.actual_percentage}%
                    </TableCell>
                    <TableCell>{TASK_STATUS_LABELS[task.status]}</TableCell>
                    <TableCell>
                      {task.time_planned_hours} / {task.time_spent_hours}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.output_deliverable || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <Section title="Tasks planned for next week">
        <p className="whitespace-pre-wrap">{report.tasks_planned_next_week}</p>
      </Section>

      <Section title="Blockers / challenges">
        {report.blockers.length === 0 ? (
          <Empty>No blockers reported.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {report.blockers.map((blocker, i) => (
              <li key={i} className="flex items-start gap-2">
                {blocker.is_key_issue ? <KeyTag>Key issue</KeyTag> : null}
                <span className="whitespace-pre-wrap">{blocker.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Achievements / highlights">
        {report.achievements.length === 0 ? (
          <Empty>No achievements recorded.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {report.achievements.map((achievement, i) => (
              <li key={i} className="flex items-start gap-2">
                {achievement.is_key_achievement ? (
                  <KeyTag tone="emerald">Key achievement</KeyTag>
                ) : null}
                <span className="whitespace-pre-wrap">{achievement.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Hours worked by task type">
        {!hours ? (
          <Empty>Not provided (optional).</Empty>
        ) : (
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {HOURS_TYPES.map((key) => (
              <li key={key}>
                <span className="text-muted-foreground">
                  {HOURS_TYPE_LABELS[key]}:
                </span>{" "}
                {hours[key]}h
              </li>
            ))}
            <li className="font-medium">Total: {totalHours}h</li>
          </ul>
        )}
      </Section>

      <Section title="Notes or links">
        {report.notes_or_links ? (
          <p className="whitespace-pre-wrap">{report.notes_or_links}</p>
        ) : (
          <Empty>None.</Empty>
        )}
      </Section>

      {report.version_history.length > 0 ? (
        <Section title={`Previous versions (${report.version_history.length})`}>
          <ul className="space-y-2">
            {report.version_history.map((version) => (
              <VersionRow key={version.version} version={version} />
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function KeyTag({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "emerald";
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
      : "border-amber-500/40 text-amber-700 dark:text-amber-400";
  return (
    <span
      className={`mt-0.5 shrink-0 rounded-full border px-1.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

function VersionRow({ version }: { version: ReportVersion }) {
  return (
    <li className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">Revision {version.version}</span>
        <span className="text-xs text-muted-foreground">
          {version.submitted_at
            ? `submitted ${formatDateTime(version.submitted_at)}`
            : `archived ${formatDateTime(version.snapshot_at)}`}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {version.tasks_completed.length} task(s) · {version.blockers.length}{" "}
        blocker(s) · {version.achievements.length} achievement(s)
      </p>
    </li>
  );
}
