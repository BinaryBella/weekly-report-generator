"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, mostRecentMonday } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Week + project scope for the insights dashboard. Both live in the URL so the
 * view is shareable, matching the team dashboard's controls.
 */
export function InsightsControls({
  week,
  projectId,
  projects,
}: {
  week: string;
  projectId?: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();

  function go(next: { week?: string; projectId?: string | null }) {
    const params = new URLSearchParams();
    params.set("week", next.week ?? week);
    const pid = next.projectId === undefined ? projectId : next.projectId;
    if (pid) params.set("project_id", pid);
    router.push(`/reviews/insights?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="insights-week">Week starting</Label>
        <Input
          id="insights-week"
          type="date"
          className="w-auto"
          value={week}
          onChange={(e) => e.target.value && go({ week: e.target.value })}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go({ week: addDays(week, -7) })}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go({ week: addDays(week, 7) })}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => go({ week: mostRecentMonday() })}
      >
        This week
      </Button>

      <div className="space-y-1">
        <Label htmlFor="insights-project">Project</Label>
        <select
          id="insights-project"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={projectId ?? ""}
          onChange={(e) => go({ projectId: e.target.value || null })}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
