import type { ReactNode } from "react";

import { formatWeekRange } from "@/lib/format";
import {
  HOURS_TYPES,
  HOURS_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/report-schema";
import type { ReportContent } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Read-only rendering of the fixed report structure, in order. Works for a live
 * report or any archived version, since both share the {@link ReportContent}
 * shape. The header row and manager actions live in the callers.
 */
export function ReportSections({
  content,
  projectName,
}: {
  content: ReportContent;
  projectName?: string;
}) {
  const hours = content.hours_worked_breakdown;
  const totalHours = hours
    ? HOURS_TYPES.reduce((sum, key) => sum + hours[key], 0)
    : 0;

  return (
    <div className="space-y-8">
      <Section title="Week / date range">
        <p>{formatWeekRange(content.week_start_date, content.week_end_date)}</p>
      </Section>

      {projectName !== undefined ? (
        <Section title="Project / category">
          <p>{projectName}</p>
        </Section>
      ) : null}

      <Section title="Tasks completed">
        {content.tasks_completed.length === 0 ? (
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
                {content.tasks_completed.map((task, i) => (
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
        <p className="whitespace-pre-wrap">{content.tasks_planned_next_week}</p>
      </Section>

      <Section title="Blockers / challenges">
        {content.blockers.length === 0 ? (
          <Empty>No blockers reported.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {content.blockers.map((blocker, i) => (
              <li key={i} className="flex items-start gap-2">
                {blocker.is_key_issue ? <KeyTag>Key issue</KeyTag> : null}
                <span className="whitespace-pre-wrap">{blocker.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Achievements / highlights">
        {content.achievements.length === 0 ? (
          <Empty>No achievements recorded.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {content.achievements.map((achievement, i) => (
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
        {content.notes_or_links ? (
          <p className="whitespace-pre-wrap">{content.notes_or_links}</p>
        ) : (
          <Empty>None.</Empty>
        )}
      </Section>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function KeyTag({
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
