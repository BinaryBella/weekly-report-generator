"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

import {
  createReportAction,
  submitReportAction,
  updateReportAction,
} from "@/lib/report-actions";
import {
  HOURS_TYPES,
  HOURS_TYPE_LABELS,
  NOTES_MAX,
  TASKS_PLANNED_MAX,
  TASK_NAME_MAX,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TEXT_MAX,
  blankReportInput,
  emptyHours,
  emptyTask,
  reportToInput,
  validateReportInput,
  type ReportInput,
} from "@/lib/report-schema";
import type {
  Project,
  Report,
  ReportTask,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toInt(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The Personal Weekly Report form. The structure is fixed and identical for
 * every user — the same fields, in the same order — so there is no way to add,
 * reorder, or remove fields, only to fill them in. Used for both creating a
 * draft (`mode="create"`) and editing one that is a draft or needs correction
 * (`mode="edit"`).
 */
export function ReportForm({
  mode,
  report,
  projects,
  projectsError,
}: {
  mode: "create" | "edit";
  report?: Report;
  projects: Project[];
  projectsError?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ReportInput>(() =>
    report ? reportToInput(report) : blankReportInput()
  );
  const [hoursEnabled, setHoursEnabled] = useState(
    Boolean(report?.hours_worked_breakdown)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"draft" | "submit" | null>(null);
  const [pending, startTransition] = useTransition();

  const hours = form.hours_worked_breakdown ?? emptyHours();
  const noProjects = !projectsError && projects.length === 0;
  const disabled = pending || noProjects || Boolean(projectsError);

  // Keep the report's current project selectable even if it was later
  // deactivated (edit / correction flow).
  const projectOptions = useMemo(() => {
    const options = projects.map((p) => ({
      id: p.id,
      name: p.name,
      active: p.is_active,
    }));
    if (form.project_id && !options.some((o) => o.id === form.project_id)) {
      options.push({ id: form.project_id, name: "Current project", active: true });
    }
    return options;
  }, [projects, form.project_id]);

  function patch(next: Partial<ReportInput>) {
    setForm((f) => ({ ...f, ...next }));
  }

  // -- Completed tasks ---------------------------------------------------
  function updateTask(index: number, next: Partial<ReportTask>) {
    setForm((f) => ({
      ...f,
      tasks_completed: f.tasks_completed.map((task, i) =>
        i === index ? { ...task, ...next } : task
      ),
    }));
  }
  function addTask() {
    setForm((f) => ({
      ...f,
      tasks_completed: [...f.tasks_completed, emptyTask()],
    }));
  }
  function removeTask(index: number) {
    setForm((f) => ({
      ...f,
      tasks_completed: f.tasks_completed.filter((_, i) => i !== index),
    }));
  }

  // -- Blockers / achievements (shared list shape) ---------------------
  function addBlocker() {
    setForm((f) => ({
      ...f,
      blockers: [
        ...f.blockers,
        { text: "", is_key_issue: f.blockers.length === 0 },
      ],
    }));
  }
  function updateBlocker(index: number, text: string) {
    setForm((f) => ({
      ...f,
      blockers: f.blockers.map((b, i) => (i === index ? { ...b, text } : b)),
    }));
  }
  function removeBlocker(index: number) {
    setForm((f) => {
      const blockers = f.blockers.filter((_, i) => i !== index);
      if (blockers.length > 0 && !blockers.some((b) => b.is_key_issue)) {
        blockers[0] = { ...blockers[0], is_key_issue: true };
      }
      return { ...f, blockers };
    });
  }
  function setKeyBlocker(index: number) {
    setForm((f) => ({
      ...f,
      blockers: f.blockers.map((b, i) => ({ ...b, is_key_issue: i === index })),
    }));
  }

  function addAchievement() {
    setForm((f) => ({
      ...f,
      achievements: [
        ...f.achievements,
        { text: "", is_key_achievement: f.achievements.length === 0 },
      ],
    }));
  }
  function updateAchievement(index: number, text: string) {
    setForm((f) => ({
      ...f,
      achievements: f.achievements.map((a, i) =>
        i === index ? { ...a, text } : a
      ),
    }));
  }
  function removeAchievement(index: number) {
    setForm((f) => {
      const achievements = f.achievements.filter((_, i) => i !== index);
      if (
        achievements.length > 0 &&
        !achievements.some((a) => a.is_key_achievement)
      ) {
        achievements[0] = { ...achievements[0], is_key_achievement: true };
      }
      return { ...f, achievements };
    });
  }
  function setKeyAchievement(index: number) {
    setForm((f) => ({
      ...f,
      achievements: f.achievements.map((a, i) => ({
        ...a,
        is_key_achievement: i === index,
      })),
    }));
  }

  // -- Hours breakdown (optional) ------------------------------------
  function toggleHours(enabled: boolean) {
    setHoursEnabled(enabled);
    patch({ hours_worked_breakdown: enabled ? hours : null });
  }
  function updateHours(key: (typeof HOURS_TYPES)[number], value: number) {
    setForm((f) => ({
      ...f,
      hours_worked_breakdown: {
        ...(f.hours_worked_breakdown ?? emptyHours()),
        [key]: value,
      },
    }));
  }

  const blockerKeyIndex =
    form.blockers.length > 0
      ? Math.max(
          0,
          form.blockers.findIndex((b) => b.is_key_issue)
        )
      : -1;
  const achievementKeyIndex =
    form.achievements.length > 0
      ? Math.max(
          0,
          form.achievements.findIndex((a) => a.is_key_achievement)
        )
      : -1;

  function save(submitAfter: boolean) {
    setFormError(null);
    const errors = validateReportInput(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    setIntent(submitAfter ? "submit" : "draft");
    startTransition(async () => {
      const saved =
        mode === "create"
          ? await createReportAction(form)
          : await updateReportAction(report!.id, form);

      if (!saved.ok) {
        setFieldErrors(saved.fieldErrors ?? {});
        setFormError(
          saved.error ??
            (saved.fieldErrors
              ? "Please fix the highlighted fields before saving."
              : "Could not save the report.")
        );
        setIntent(null);
        return;
      }

      const id = saved.reportId ?? report!.id;

      if (submitAfter) {
        const submitted = await submitReportAction(id);
        if (!submitted.ok) {
          // The content did save — send them to the report so they can retry.
          setFormError(submitted.error ?? "Could not submit the report.");
          setIntent(null);
          router.push(`/dashboard/reports/${id}`);
          router.refresh();
          return;
        }
      }

      router.push(`/dashboard/reports/${id}`);
      router.refresh();
    });
  }

  const submitLabel =
    report?.status === "NEEDS_CORRECTION"
      ? "Save & resubmit for review"
      : "Save & submit for review";

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {/* 1. Week / date range */}
      <FormSection step={1} title="Week / date range">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="week-start">Week start</Label>
            <Input
              id="week-start"
              type="date"
              value={form.week_start_date}
              onChange={(e) => patch({ week_start_date: e.target.value })}
            />
            <FieldError message={fieldErrors.week_start_date} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="week-end">Week end</Label>
            <Input
              id="week-end"
              type="date"
              value={form.week_end_date}
              onChange={(e) => patch({ week_end_date: e.target.value })}
            />
            <FieldError message={fieldErrors.week_end_date} />
          </div>
        </div>
      </FormSection>

      {/* 2. Project / category tag */}
      <FormSection step={2} title="Project / category tag">
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
          <Select
            value={form.project_id}
            onValueChange={(value) => patch({ project_id: value })}
          >
            <SelectTrigger id="project" className="sm:max-w-sm">
              <SelectValue placeholder="Choose a project / category" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                  {option.active ? "" : " (inactive)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <FieldError message={fieldErrors.project_id} />
      </FormSection>

      {/* 3. Tasks completed */}
      <FormSection step={3} title="Tasks completed">
        <FieldError message={fieldErrors.tasks_completed} />
        {form.tasks_completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a row for each task you worked on this week.
          </p>
        ) : (
          <div className="space-y-4">
            {form.tasks_completed.map((task, index) => (
              <div key={index} className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Task {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeTask(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Task name</Label>
                    <Input
                      value={task.task_name}
                      maxLength={TASK_NAME_MAX}
                      onChange={(e) =>
                        updateTask(index, { task_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) =>
                        updateTask(index, { priority: value as TaskPriority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {TASK_PRIORITY_LABELS[priority]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        updateTask(index, { status: value as TaskStatus })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Planned %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={String(task.planned_percentage)}
                      onChange={(e) =>
                        updateTask(index, {
                          planned_percentage: toInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Actual %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={String(task.actual_percentage)}
                      onChange={(e) =>
                        updateTask(index, {
                          actual_percentage: toInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Time planned (h)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={String(task.time_planned_hours)}
                      onChange={(e) =>
                        updateTask(index, {
                          time_planned_hours: toNum(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Time spent (h)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={String(task.time_spent_hours)}
                      onChange={(e) =>
                        updateTask(index, {
                          time_spent_hours: toNum(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Output / deliverable produced</Label>
                    <Textarea
                      rows={2}
                      value={task.output_deliverable ?? ""}
                      maxLength={TEXT_MAX}
                      onChange={(e) =>
                        updateTask(index, {
                          output_deliverable: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={addTask}>
          <Plus className="mr-1 h-4 w-4" />
          Add task
        </Button>
      </FormSection>

      {/* 4. Tasks planned for next week */}
      <FormSection step={4} title="Tasks planned for next week">
        <Textarea
          rows={4}
          value={form.tasks_planned_next_week}
          maxLength={TASKS_PLANNED_MAX}
          placeholder="What you plan to work on next week."
          onChange={(e) => patch({ tasks_planned_next_week: e.target.value })}
        />
        <FieldError message={fieldErrors.tasks_planned_next_week} />
      </FormSection>

      {/* 5. Blockers / challenges */}
      <FlaggedListSection
        step={5}
        title="Blockers / challenges"
        description="Flag the one that was the key issue for the week."
        addLabel="Add blocker"
        emptyText="No blockers this week."
        flagName="key-blocker"
        flagLabel="Key issue"
        placeholder="Describe the blocker or challenge."
        items={form.blockers.map((b) => b.text)}
        keyIndex={blockerKeyIndex}
        onAdd={addBlocker}
        onChange={updateBlocker}
        onRemove={removeBlocker}
        onSetKey={setKeyBlocker}
      />

      {/* 6. Achievements / highlights */}
      <FlaggedListSection
        step={6}
        title="Achievements / highlights"
        description="Flag the one that was the key achievement for the week."
        addLabel="Add achievement"
        emptyText="No highlights recorded."
        flagName="key-achievement"
        flagLabel="Key achievement"
        placeholder="Describe the achievement or highlight."
        items={form.achievements.map((a) => a.text)}
        keyIndex={achievementKeyIndex}
        onAdd={addAchievement}
        onChange={updateAchievement}
        onRemove={removeAchievement}
        onSetKey={setKeyAchievement}
      />

      {/* 7. Hours worked, by task type (optional) */}
      <FormSection step={7} title="Hours worked, by task type" optional>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={hoursEnabled}
            onChange={(e) => toggleHours(e.target.checked)}
          />
          Record an hours breakdown for this week
        </label>
        {hoursEnabled ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {HOURS_TYPES.map((key) => (
              <div key={key} className="space-y-1">
                <Label>{HOURS_TYPE_LABELS[key]}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={String(hours[key])}
                  onChange={(e) => updateHours(key, toNum(e.target.value))}
                />
              </div>
            ))}
          </div>
        ) : null}
      </FormSection>

      {/* 8. Optional notes or links */}
      <FormSection step={8} title="Notes or links" optional>
        <Textarea
          rows={3}
          value={form.notes_or_links ?? ""}
          maxLength={NOTES_MAX}
          placeholder="Anything else worth noting, or links to deliverables."
          onChange={(e) => patch({ notes_or_links: e.target.value })}
        />
        <FieldError message={fieldErrors.notes_or_links} />
      </FormSection>

      <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            router.push(
              mode === "edit" && report
                ? `/dashboard/reports/${report.id}`
                : "/dashboard/reports"
            )
          }
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => save(false)}
        >
          {pending && intent === "draft" ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => save(true)}
        >
          {pending && intent === "submit" ? "Submitting…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  step,
  title,
  optional,
  children,
}: {
  step: number;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold">
          <span className="text-muted-foreground">{step}.</span> {title}
        </h2>
        {optional ? (
          <span className="text-xs text-muted-foreground">Optional</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Section 5 and 6 share this shape: a list of text rows, one flagged as key. */
function FlaggedListSection({
  step,
  title,
  description,
  addLabel,
  emptyText,
  flagName,
  flagLabel,
  placeholder,
  items,
  keyIndex,
  onAdd,
  onChange,
  onRemove,
  onSetKey,
}: {
  step: number;
  title: string;
  description: string;
  addLabel: string;
  emptyText: string;
  flagName: string;
  flagLabel: string;
  placeholder: string;
  items: string[];
  keyIndex: number;
  onAdd: () => void;
  onChange: (index: number, text: string) => void;
  onRemove: (index: number) => void;
  onSetKey: (index: number) => void;
}) {
  return (
    <FormSection step={step} title={title}>
      <p className="text-sm text-muted-foreground">{description}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((text, index) => (
            <li key={index} className="flex items-start gap-3 rounded-md border p-3">
              <label className="mt-2 flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name={flagName}
                  className="h-4 w-4"
                  checked={keyIndex === index}
                  onChange={() => onSetKey(index)}
                />
                {flagLabel}
              </label>
              <Textarea
                rows={2}
                value={text}
                maxLength={TEXT_MAX}
                placeholder={placeholder}
                onChange={(e) => onChange(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 shrink-0 text-destructive hover:text-destructive"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-1 h-4 w-4" />
        {addLabel}
      </Button>
    </FormSection>
  );
}
