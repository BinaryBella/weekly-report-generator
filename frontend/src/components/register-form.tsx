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

import { registerAction, type AuthFormState } from "@/lib/auth-actions";
import {
  MIN_PASSWORD_LENGTH,
  validateRegister,
  type RegisterFieldErrors,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/field-error";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthFormState = {};

const invalidFieldClass = "border-destructive focus-visible:ring-destructive";

type RegisterField = "name" | "email" | "password" | "confirmPassword";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const succeeded = Boolean(state.ok);

  // Reflect field errors reported by the server action.
  useEffect(() => {
    if (state.fieldErrors) setErrors(state.fieldErrors);
  }, [state]);

  // On success, confirm briefly then send the user to sign in.
  useEffect(() => {
    if (state.ok && state.redirectTo) {
      const timer = setTimeout(
        () => router.push(state.redirectTo as string),
        900
      );
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  function currentValues() {
    return {
      name: nameRef.current?.value ?? "",
      email: emailRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
      confirmPassword: confirmRef.current?.value ?? "",
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateRegister(currentValues());
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      const refs = {
        name: nameRef,
        email: emailRef,
        password: passwordRef,
        confirmPassword: confirmRef,
      };
      const firstInvalid = (
        ["name", "email", "password", "confirmPassword"] as RegisterField[]
      ).find((field) => nextErrors[field]);
      if (firstInvalid) refs[firstInvalid].current?.focus();
    }
  }

  function validateField(field: RegisterField) {
    const fieldErrors = validateRegister(currentValues());
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  }

  function clearField(field: RegisterField) {
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
      {succeeded ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Account created. Taking you to the sign-in page…
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
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            ref={nameRef}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(errors.name && invalidFieldClass)}
            onBlur={() => validateField("name")}
            onChange={() => clearField("name")}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>

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
            autoComplete="new-password"
            ref={passwordRef}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "password-error" : "password-hint"
            }
            className={cn(errors.password && invalidFieldClass)}
            onBlur={() => validateField("password")}
            onChange={() => clearField("password")}
          />
          <FieldError id="password-error" message={errors.password} />
          {!errors.password ? (
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            ref={confirmRef}
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            className={cn(errors.confirmPassword && invalidFieldClass)}
            onBlur={() => validateField("confirmPassword")}
            onChange={() => clearField("confirmPassword")}
          />
          <FieldError
            id="confirmPassword-error"
            message={errors.confirmPassword}
          />
        </div>
      </fieldset>

      <SubmitButton
        className="w-full"
        pendingText="Creating account…"
        disabled={busy}
      >
        {succeeded ? "Account created" : "Create account"}
      </SubmitButton>
    </form>
  );
}
