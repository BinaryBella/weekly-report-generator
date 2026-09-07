import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; next?: string }>;
}) {
  const params = await searchParams;
  const justRegistered = params.registered === "1";
  const next =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : undefined;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: illustration panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#1e40af]">
            Weekly Report Generator
          </p>
          <p className="max-w-sm text-sm text-[#1e3a8a]/70">
            Sign in to create, review, and share your team&apos;s weekly
            reports.
          </p>
        </div>
        <img
          src="/login.jpg"
          alt="Person signing in to an account on a laptop"
          className="mx-auto w-full max-w-lg object-contain"
        />
        <p className="text-xs text-[#1e3a8a]/60">
          &copy; {new Date().getFullYear()} Weekly Report Generator
        </p>
      </div>

      {/* Right: sign-in form */}
      <div className="flex items-center justify-center bg-[#eaf1fb] px-4 py-12">
        <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the Weekly Report Generator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {justRegistered ? (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Account created. You can sign in now.
                </AlertDescription>
              </Alert>
            ) : null}
            <LoginForm next={next} />
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Don&apos;t have an account?&nbsp;
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
