"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { REPORT_STATUS_LABELS, type ReportStatus } from "@/lib/types";

const REVIEW_STATUSES: ReportStatus[] = [
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "APPROVED",
];

function buildHref(status?: ReportStatus, userId?: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (userId) params.set("user_id", userId);
  const qs = params.toString();
  return qs ? `/reviews?${qs}` : "/reviews";
}

/** Status chips + team-member picker for the manager review queue. */
export function ReviewsFilters({
  activeStatus,
  activeUserId,
  members,
}: {
  activeStatus?: ReportStatus;
  activeUserId?: string;
  members: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip
          label="All"
          href={buildHref(undefined, activeUserId)}
          active={!activeStatus}
        />
        {REVIEW_STATUSES.map((status) => (
          <Chip
            key={status}
            label={REPORT_STATUS_LABELS[status]}
            href={buildHref(status, activeUserId)}
            active={activeStatus === status}
          />
        ))}
      </div>

      {members.length > 0 ? (
        <select
          value={activeUserId ?? ""}
          onChange={(e) =>
            router.push(buildHref(activeStatus, e.target.value || undefined))
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All team members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
