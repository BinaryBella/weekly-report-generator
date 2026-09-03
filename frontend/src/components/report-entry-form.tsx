"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  createReportEntryAction,
  type ReportEntryFormState,
} from "@/lib/report-actions";
import type { Project } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

const initialState: ReportEntryFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

/**
 * Minimal "new weekly report entry" form. Its point here is the
 * project/category selector (deliverable 6) — a Team Member picks which project
 * the entry is filed under. The full reporting workspace is a separate section.
 */
export function ReportEntryForm({
  projects,
  projectsError,
}: {
  projects: Project[];
  projectsError?: string;
}) {
  const [state, formAction] = useActionState(
    createReportEntryAction,
    initialState
  );
  const fieldErrors = state.fieldErrors ?? {};
  // Radix Select is not a native form control; mirror its value into a hidden input.
  const [projectId, setProjectId] = useState("");

  if (state.ok) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Draft report saved.{" "}
          <Link
            href="/dashboard"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  const noProjects = !projectsError && projects.length === 0;

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" name="project_id" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="report-project">Project / category</Label>
        {projectsError ? (
          <p className="text-sm text-destructive">{projectsError}</p>
        ) : noProjects ? (
          <p className="text-sm text-muted-foreground">
            No active projects yet. Ask a Manager or Admin to create one on the{" "}
            <Link
              href="/projects"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Projects
            </Link>{" "}
            page.
          </p>
        ) : (
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="report-project">
              <SelectValue placeholder="Choose a project / category" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <FieldError message={fieldErrors.project_id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="week-start">Week start</Label>
          <Input id="week-start" name="week_start_date" type="date" required />
          <FieldError message={fieldErrors.week_start_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="week-end">Week end</Label>
          <Input id="week-end" name="week_end_date" type="date" required />
          <FieldError message={fieldErrors.week_end_date} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tasks-planned">Tasks planned for next week</Label>
        <Textarea
          id="tasks-planned"
          name="tasks_planned_next_week"
          rows={4}
          placeholder="What you plan to work on next week."
          required
        />
        <FieldError message={fieldErrors.tasks_planned_next_week} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-notes">Notes or links</Label>
        <Textarea
          id="report-notes"
          name="notes_or_links"
          rows={3}
          placeholder="Optional — anything else worth noting."
        />
      </div>

      {noProjects || projectsError ? (
        <Button type="button" className="w-full" disabled>
          Save draft report
        </Button>
      ) : (
        <SubmitButton className="w-full" pendingText="Saving…">
          Save draft report
        </SubmitButton>
      )}
    </form>
  );
}
