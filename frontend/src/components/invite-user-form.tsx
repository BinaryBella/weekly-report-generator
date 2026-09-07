"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";

import { createUserAction } from "@/lib/user-actions";
import { validateInvite } from "@/lib/validation";
import { ROLES, type Role, type User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/field-error";

const invalidFieldClass = "border-destructive focus-visible:ring-destructive";

/**
 * Invite a team member: creates their account and (when SMTP is configured on
 * the backend) emails them the sign-in credentials. Controlled inputs +
 * a direct action call, rather than native form submission, so the Role
 * `<Select>` can drive validated state cleanly.
 */
export function InviteUserForm({
  onInvited,
  onCancel,
}: {
  onInvited: (
    user: User,
    temporaryPassword: string | null,
    emailSent: boolean
  ) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Team Member");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearFieldError(field: string) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function submit() {
    setFormError(null);
    const values = { name, email, password };
    const errors = validateInvite(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const res = await createUserAction({ ...values, role });
      if (!res.ok || !res.user) {
        setFieldErrors(res.fieldErrors ?? {});
        setFormError(
          res.error ??
            (res.fieldErrors
              ? "Please fix the highlighted fields."
              : "Could not invite the team member.")
        );
        return;
      }
      onInvited(res.user, res.temporaryPassword ?? null, Boolean(res.emailSent));
    });
  }

  return (
    <div className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Full name</Label>
          <Input
            id="invite-name"
            value={name}
            maxLength={120}
            autoFocus
            placeholder="Ada Lovelace"
            aria-invalid={fieldErrors.name ? true : undefined}
            className={cn(fieldErrors.name && invalidFieldClass)}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
          />
          <FieldError message={fieldErrors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            inputMode="email"
            value={email}
            placeholder="ada@example.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            className={cn(fieldErrors.email && invalidFieldClass)}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
          />
          <FieldError message={fieldErrors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-password">
            Password{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <PasswordInput
            id="invite-password"
            autoComplete="new-password"
            value={password}
            placeholder="Leave blank to auto-generate"
            aria-invalid={fieldErrors.password ? true : undefined}
            className={cn(fieldErrors.password && invalidFieldClass)}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
          />
          <FieldError message={fieldErrors.password} />
          <p className="text-xs text-muted-foreground">
            We&apos;ll try to email these sign-in credentials to the team
            member. Leave the password blank to generate one; if email isn&apos;t
            set up, you&apos;ll get it back here to share yourself.
          </p>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? <Spinner size="sm" className="mr-2" /> : null}
          {pending ? "Sending invite…" : "Send invite"}
        </Button>
      </div>
    </div>
  );
}
