"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, mostRecentMonday } from "@/lib/format";
import { REPORT_SECTIONS, REPORT_SECTION_LABELS } from "@/lib/report-schema";
import { REPORT_STATUS_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Every dashboard control is URL state, so the whole page is shareable. */
export interface DashboardParams {
  week: string;
  section?: string;
  status?: string;
  user_id?: string;
  project_id?: string;
  from?: string;
  to?: string;
}

// Only these can be filtered from `GET /reports/` — a DRAFT is never listed.
const LIST_STATUSES = ["SUBMITTED", "NEEDS_CORRECTION", "APPROVED"] as const;

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function href(params: DashboardParams, overrides: Partial<DashboardParams>): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  return `/reviews?${search.toString()}`;
}

export function WeekPicker({ params }: { params: DashboardParams }) {
  const router = useRouter();
  const go = (week: string) => router.push(href(params, { week }));

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="dash-week">Week starting</Label>
        <Input
          id="dash-week"
          type="date"
          className="w-auto"
          value={params.week}
          onChange={(e) => e.target.value && go(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go(addDays(params.week, -7))}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go(addDays(params.week, 7))}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => go(mostRecentMonday())}
      >
        This week
      </Button>
    </div>
  );
}

export function SectionPicker({ params }: { params: DashboardParams }) {
  const router = useRouter();
  return (
    <div className="space-y-1">
      <Label htmlFor="dash-section">Compare a section across the team</Label>
      <select
        id="dash-section"
        className={selectClass}
        value={params.section ?? ""}
        onChange={(e) =>
          router.push(href(params, { section: e.target.value || undefined }))
        }
      >
        <option value="">Choose a section…</option>
        {REPORT_SECTIONS.map((section) => (
          <option key={section} value={section}>
            {REPORT_SECTION_LABELS[section]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TeamReportFilters({
  params,
  members,
  projects,
}: {
  params: DashboardParams;
  members: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const set = (overrides: Partial<DashboardParams>) =>
    router.push(href(params, overrides));

  const hasFilters =
    params.status || params.user_id || params.project_id || params.from || params.to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="f-member">Team member</Label>
        <select
          id="f-member"
          className={selectClass}
          value={params.user_id ?? ""}
          onChange={(e) => set({ user_id: e.target.value || undefined })}
        >
          <option value="">All team members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-project">Project</Label>
        <select
          id="f-project"
          className={selectClass}
          value={params.project_id ?? ""}
          onChange={(e) => set({ project_id: e.target.value || undefined })}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-status">Status</Label>
        <select
          id="f-status"
          className={selectClass}
          value={params.status ?? ""}
          onChange={(e) => set({ status: e.target.value || undefined })}
        >
          <option value="">Any status</option>
          {LIST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REPORT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-from">From week</Label>
        <Input
          id="f-from"
          type="date"
          className="w-auto"
          value={params.from ?? ""}
          onChange={(e) => set({ from: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-to">To week</Label>
        <Input
          id="f-to"
          type="date"
          className="w-auto"
          value={params.to ?? ""}
          onChange={(e) => set({ to: e.target.value || undefined })}
        />
      </div>

      {hasFilters ? (
        <Button asChild variant="ghost" size="sm">
          <Link
            href={href(
              { week: params.week, section: params.section } as DashboardParams,
              {}
            )}
          >
            Clear filters
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
