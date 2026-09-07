"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { loginAction, type AuthFormState } from "@/lib/auth-actions";
import { validateLogin, type LoginFieldErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/field-error";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthFormState = {};

const invalidFieldClass = "border-destructive focus-visible:ring-destructive";

type LoginField = "email" | "password";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const succeeded = Boolean(state.ok);

  // Reflect field errors reported by the server action.
  useEffect(() => {
    if (state.fieldErrors) setErrors(state.fieldErrors);
  }, [state]);

  // On success the session cookies are already set — show the confirmation
  // briefly, then move the user on.
  useEffect(() => {
    if (state.ok && state.redirectTo) {
      const timer = setTimeout(() => {
        router.push(state.redirectTo as string);
        router.refresh();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  function currentValues() {
    return {
      email: emailRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateLogin(currentValues());
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
    }
  }

  function validateField(field: LoginField) {
    const fieldErrors = validateLogin(currentValues());
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  }

  function clearField(field: LoginField) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  const busy = isPending || succeeded;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {succeeded ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Signed in successfully. Redirecting you now…
          </AlertDescription>
        </Alert>
      ) : state.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            ref={emailRef}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn(errors.email && invalidFieldClass)}
            onBlur={() => validateField("email")}
            onChange={() => clearField("email")}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            ref={passwordRef}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(errors.password && invalidFieldClass)}
            onBlur={() => validateField("password")}
            onChange={() => clearField("password")}
          />
          <FieldError id="password-error" message={errors.password} />
        </div>
      </fieldset>

      <SubmitButton className="w-full" pendingText="Signing in…" disabled={busy}>
        {succeeded ? "Signed in" : "Sign in"}
      </SubmitButton>
    </form>
  );
}
