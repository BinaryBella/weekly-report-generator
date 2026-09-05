import type { ReactNode } from "react";

import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import type { Role, UserStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { ThemePreference } from "@/components/theme-preference";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account settings · Weekly Report Generator",
};

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children ?? value}</dd>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded-full border border-input bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const active = status === "active";
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
      }
    >
      {active ? "Active" : "Disabled"}
    </span>
  );
}

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Account settings</h1>
        <p className="text-muted-foreground">
          Your profile details and preferences for this app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>
            Your name, email, and role are managed by a Manager. Contact a
            Manager if any of these need to change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field label="Role">
              <RoleBadge role={user.role} />
            </Field>
            <Field label="Account status">
              <StatusBadge status={user.status} />
            </Field>
            <Field label="Member since" value={formatDateTime(user.created_at)} />
            <Field
              label="Last updated"
              value={formatDateTime(user.updated_at)}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>
            Choose how the app looks. This preference is saved to this browser
            only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePreference />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password &amp; sign-in</CardTitle>
          <CardDescription>
            Self-service password changes aren&apos;t available yet — ask a
            Manager to reset your password if you need to. Signing out ends your
            session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
