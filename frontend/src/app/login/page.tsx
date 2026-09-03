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
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
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
    </main>
  );
}
