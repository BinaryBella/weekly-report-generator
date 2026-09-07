"use client";

import { useMemo, type ReactNode } from "react";

import {
  HOURS_TYPES,
  HOURS_TYPE_LABELS,
  REPORT_SECTION_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/report-schema";
import { formatDate } from "@/lib/format";
import {
  TEAM_REPORT_STATUS_LABELS,
  type Achievement,
  type Blocker,
  type HoursWorkedBreakdown,
  type ReportTask,
  type TeamSectionEntry,
  type TeamSectionResponse,
} from "@/lib/types";
import { usePagedList } from "@/hooks/use-paged-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPagination } from "@/components/ui/list-pagination";
import { SearchInput } from "@/components/ui/search-input";
import { KeyTag } from "@/components/report-sections";
import { TeamStatusBadge } from "@/components/team-status-badge";

/**
 * One report section shown for every team member side by side, so a manager can
 * scan e.g. all blockers for the week without opening each report. A member's
 * card shows why their content is unavailable when it is (not started, or still
 * a private draft).
 */
export function TeamSectionCompare({ data }: { data: TeamSectionResponse }) {
  const entries = useMemo(
    () =>
      [...data.entries].sort((a, b) =>
        a.user_name.localeCompare(b.user_name)
      ),
    [data.entries]
  );
  const list = usePagedList(
    entries,
    (entry) =>
      `${entry.user_name} ${TEAM_REPORT_STATUS_LABELS[entry.status]}`,
    10
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {REPORT_SECTION_LABELS[data.section]} · week starting{" "}
          {formatDate(data.week_start_date)}
        </p>
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder="Search team members…"
        />
      </div>
      {list.total === 0 ? (
        <EmptyState
          title={
            list.query
              ? "No team members match your search"
              : "No team members to compare for this week"
          }
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.pageItems.map((entry) => (
              <li
                key={entry.user_id}
                className="space-y-2 rounded-md border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{entry.user_name}</span>
                  <TeamStatusBadge status={entry.status} />
                </div>
                <SectionContent section={data.section} entry={entry} />
              </li>
            ))}
          </ul>
          <ListPagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            total={list.total}
            rangeStart={list.rangeStart}
            rangeEnd={list.rangeEnd}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            itemLabel="members"
          />
        </>
      )}
    </div>
  );
}

function SectionContent({
  section,
  entry,
}: {
  section: TeamSectionResponse["section"];
  entry: TeamSectionEntry;
}) {
  if (entry.status === "NOT_STARTED") {
    return <Muted>Not started.</Muted>;
  }
  if (entry.status === "DRAFT" || entry.content === null) {
    return <Muted>Draft not yet submitted — content is private.</Muted>;
  }

  switch (section) {
    case "blockers": {
      const items = entry.content as Blocker[];
      if (items.length === 0) return <Muted>No blockers.</Muted>;
      return (
        <ul className="space-y-1">
          {items.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              {b.is_key_issue ? <KeyTag>Key</KeyTag> : null}
              <span className="whitespace-pre-wrap">{b.text}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "achievements": {
      const items = entry.content as Achievement[];
      if (items.length === 0) return <Muted>No achievements.</Muted>;
      return (
        <ul className="space-y-1">
          {items.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              {a.is_key_achievement ? <KeyTag tone="emerald">Key</KeyTag> : null}
              <span className="whitespace-pre-wrap">{a.text}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "tasks_completed": {
      const items = entry.content as ReportTask[];
      if (items.length === 0) return <Muted>No tasks recorded.</Muted>;
      return (
        <ul className="space-y-1">
          {items.map((t, i) => (
            <li key={i}>
              <span className="font-medium">{t.task_name}</span>{" "}
              <span className="text-muted-foreground">
                — {TASK_STATUS_LABELS[t.status]} · {TASK_PRIORITY_LABELS[t.priority]}{" "}
                · {t.actual_percentage}%/{t.planned_percentage}% ·{" "}
                {t.time_spent_hours}h/{t.time_planned_hours}h
              </span>
            </li>
          ))}
        </ul>
      );
    }
    case "hours_worked_breakdown": {
      const hours = entry.content as HoursWorkedBreakdown;
      const total = HOURS_TYPES.reduce((sum, k) => sum + hours[k], 0);
      return (
        <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
          {HOURS_TYPES.map((k) => (
            <li key={k}>
              <span className="text-muted-foreground">{HOURS_TYPE_LABELS[k]}:</span>{" "}
              {hours[k]}h
            </li>
          ))}
          <li className="font-medium">Total: {total}h</li>
        </ul>
      );
    }
    case "tasks_planned_next_week": {
      return (
        <p className="whitespace-pre-wrap">{entry.content as string}</p>
      );
    }
    case "notes_or_links": {
      const text = entry.content as string | null;
      return text ? (
        <p className="whitespace-pre-wrap">{text}</p>
      ) : (
        <Muted>None.</Muted>
      );
    }
    default:
      return null;
  }
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}
