"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/lib/project-actions";
import type { Project } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

const initialState: ProjectFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

/**
 * Create/edit form for a project/category. Used for both flows: pass a
 * `project` to edit it, omit it to create a new one. Calls `onSuccess` with the
 * saved record once the backend accepts it.
 */
export function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: {
  project?: Project;
  onSuccess: (project: Project) => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(project);
  const action = isEdit
    ? updateProjectAction.bind(null, project!.id)
    : createProjectAction;

  const [state, formAction] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const handledRef = useRef(false);

  useEffect(() => {
    if (state.ok && state.project && !handledRef.current) {
      handledRef.current = true;
      onSuccess(state.project);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          name="name"
          type="text"
          defaultValue={project?.name ?? ""}
          placeholder="e.g. Client A, Internal Tooling, R&D"
          maxLength={100}
          autoFocus
          required
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          name="description"
          defaultValue={project?.description ?? ""}
          placeholder="Optional — what this project / category covers."
          maxLength={500}
          rows={3}
        />
        <FieldError message={fieldErrors.description} />
        <p className="text-xs text-muted-foreground">Optional. Up to 500 characters.</p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pendingText={isEdit ? "Saving…" : "Creating…"}>
          {isEdit ? "Save changes" : "Create project"}
        </SubmitButton>
      </div>
    </form>
  );
}
