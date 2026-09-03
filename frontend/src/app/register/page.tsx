import Link from "next/link";

import { RegisterForm } from "@/components/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: illustration panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#1e40af]">
            Weekly Report Generator
          </p>
          <p className="max-w-sm text-sm text-[#1e3a8a]/70">
            Create an account to start building, reviewing, and sharing your
            team&apos;s weekly reports.
          </p>
        </div>
        <img
          src="/registration.jpg"
          alt="Person creating a new account on a laptop"
          className="mx-auto w-full max-w-lg object-contain"
        />
        <p className="text-xs text-[#1e3a8a]/60">
          &copy; {new Date().getFullYear()} Weekly Report Generator
        </p>
      </div>

      {/* Right: registration form */}
      <div className="flex items-center justify-center bg-[#eaf1fb] px-4 py-12">
        <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              New accounts start as a Team Member. An admin can change your role
              later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Already have an account?&nbsp;
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
