/** Shapes returned by the backend auth API (see backend `app/schemas/auth.py`). */

export type Role = "Team Member" | "Manager" | "Admin";

export type UserStatus = "active" | "disabled";

/** Matches the backend `UserResponse` model. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

/** Matches the backend `TokenResponse` model (`POST /auth/login`). */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

/** Matches the backend `AccessTokenResponse` model (`POST /auth/refresh`). */
export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export const ROLES: Role[] = ["Team Member", "Manager", "Admin"];

/** Roles allowed into the manager/admin area. */
export const MANAGER_ROLES: Role[] = ["Manager", "Admin"];

export function isManagerOrAdmin(role: Role): boolean {
  return role === "Manager" || role === "Admin";
}

/** Where a user lands after authenticating, based on their role. */
export function landingPathForRole(role: Role): string {
  return isManagerOrAdmin(role) ? "/admin" : "/dashboard";
}

/**
 * Shapes returned by the backend projects API (see backend
 * `app/schemas/project.py`). A "project" is also referred to as a "category" in
 * the product — the two are the same entity.
 */

/** Matches the backend `ProjectResponse` model. */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  /** User ids of the team members assigned to this project. */
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

/** Matches the backend `ProjectDeleteResponse` model (`DELETE /projects/{id}`). */
export interface ProjectDeleteResult {
  detail: string;
  /**
   * `true` when the project was kept but deactivated because reports still
   * reference it; `false` when the record was removed outright.
   */
  soft_deleted: boolean;
  project: Project | null;
}
