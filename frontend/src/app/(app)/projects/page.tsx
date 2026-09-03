import { AlertCircle } from "lucide-react";

import { requireUser } from "@/lib/session";
import { isManagerOrAdmin, type User } from "@/lib/types";
import { getAssignableUsers, getProjects } from "@/lib/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProjectsManager } from "@/components/projects-manager";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser("/projects");
  const canManage = isManagerOrAdmin(user.role);

  const projectsResult = await getProjects();

  // Member assignment is Manager/Admin-only and needs the user roster, which
  // only they can read — so only fetch it when it will be used.
  let assignableUsers: User[] = [];
  let usersError: string | undefined;
  if (canManage) {
    const usersResult = await getAssignableUsers();
    if ("data" in usersResult) assignableUsers = usersResult.data;
    else usersError = usersResult.error;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects &amp; categories</h1>
        <p className="text-muted-foreground">
          {canManage
            ? "Create the projects and categories that weekly report entries are filed under, and manage who is on each."
            : "Projects and categories you can file your weekly report entries under."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All projects</CardTitle>
          <CardDescription>
            e.g. Client A, Internal Tooling, R&amp;D, Marketing.
            {canManage
              ? " Only Managers and Admins can add, edit, or delete."
              : " Only Managers and Admins can change these."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {"error" in projectsResult ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Couldn&apos;t load projects</AlertTitle>
              <AlertDescription>{projectsResult.error}</AlertDescription>
            </Alert>
          ) : (
            <ProjectsManager
              projects={projectsResult.data}
              canManage={canManage}
              assignableUsers={assignableUsers}
              usersError={usersError}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
