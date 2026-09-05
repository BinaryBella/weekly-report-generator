/**
 * Small, dependency-free validators shared by the client forms and the server
 * actions. Keep this file free of `server-only` imports so it can run in the
 * browser.
 */

/** Pragmatic email shape check — not RFC-perfect, but catches the common typos. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 8;

export interface LoginValues {
  email: string;
  password: string;
}

export type LoginFieldErrors = Partial<Record<keyof LoginValues, string>>;

/** Client-side checks for the sign-in form. Mirrors the server action. */
export function validateLogin(values: LoginValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address, e.g. you@example.com.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterValues, string>>;

/** Client-side checks for the create-account form. Mirrors the server action. */
export function validateRegister(values: RegisterValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter your full name.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address, e.g. you@example.com.";
  }

  if (!values.password) {
    errors.password = "Enter a password.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Re-enter your password to confirm it.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export interface InviteValues {
  name: string;
  email: string;
  /** "" means the server should auto-generate one. */
  password: string;
}

export type InviteFieldErrors = Partial<Record<keyof InviteValues, string>>;

/** Client-side checks for inviting a team member. Mirrors the server action. */
export function validateInvite(values: InviteValues): InviteFieldErrors {
  const errors: InviteFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter the team member's full name.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter an email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address, e.g. you@example.com.";
  }

  if (values.password && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
}
