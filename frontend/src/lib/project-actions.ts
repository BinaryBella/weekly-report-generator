"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, readErrorDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { Project, ProjectDeleteResult } from "@/lib/types";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const EXPIRED = "Your session has expired. Sign in again.";
const PROJECTS_PATH = "/projects";

/** State returned by the create/edit form actions (drives `useActionState`). */
export interface ProjectFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** The saved project, so the client can update its list without a round-trip. */
  project?: Project;
}

interface ParsedForm {
  values: { name: string; description: string | null };
  fieldErrors: Record<string, string>;
}

/** Shared client-side validation for both create and update. */
function parseProjectForm(formData: FormData): ParsedForm {
  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const fieldErrors: Record<string, string> = {};

  if (!name) {
    fieldErrors.name = "Enter a name.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `Keep the name under ${NAME_MAX} characters.`;
  }
  if (descriptionRaw.length > DESCRIPTION_MAX) {
    fieldErrors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  return {
    values: { name, description: descriptionRaw || null },
    fieldErrors,
  };
}

/**
 * Create a project/category. Backend: `POST /projects/` (Manager/Admin only).
 * A ``400`` from the backend (duplicate name) is surfaced on the name field.
 */
export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { values, fieldErrors } = parseProjectForm(formData);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch("/projects/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not create the project.");
    if (res.status === 400) return { fieldErrors: { name: detail } };
    return { error: detail };
  }

  revalidatePath(PROJECTS_PATH);
  return { ok: true, project: (await res.json()) as Project };
}

/**
 * Update a project/category. Backend: `PUT /projects/{id}` (Manager/Admin only).
 * `id` is bound by the caller, so the signature still matches `useActionState`.
 */
export async function updateProjectAction(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { values, fieldErrors } = parseProjectForm(formData);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getAccessToken();
  if (!token) return { error: EXPIRED };

  const res = await apiFetch(`/projects/${projectId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res, "Could not update the project.");
    if (res.status === 400) return { fieldErrors: { name: detail } };
    return { error: detail };
  }

  revalidatePath(PROJECTS_PATH);
  return { ok: true, project: (await res.json()) as Project };
}

/**
 * Delete a project/category. Backend: `DELETE /projects/{id}` (Manager/Admin
 * only). The backend soft-deletes (deactivates) a project that reports still
 * reference and hard-deletes an unreferenced one; the caller is told which.
 */
export async function deleteProjectAction(
  projectId: string
): Promise<{ ok: boolean; error?: string; result?: ProjectDeleteResult }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/projects/${projectId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not delete the project."),
    };
  }

  revalidatePath(PROJECTS_PATH);
  return { ok: true, result: (await res.json()) as ProjectDeleteResult };
}

/**
 * Replace the full set of team members assigned to a project. Backend:
 * `PUT /projects/{id}/members` (Manager/Admin only). Sending an unknown user id
 * returns ``400``.
 */
export async function assignProjectMembersAction(
  projectId: string,
  memberIds: string[]
): Promise<{ ok: boolean; error?: string; project?: Project }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: EXPIRED };

  const res = await apiFetch(`/projects/${projectId}/members`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ member_ids: memberIds }),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: await readErrorDetail(res, "Could not update the members."),
    };
  }

  revalidatePath(PROJECTS_PATH);
  return { ok: true, project: (await res.json()) as Project };
}
