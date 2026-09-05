"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

function InnerButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      className="text-[#1e50ae]"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <InnerButton />
    </form>
  );
}
