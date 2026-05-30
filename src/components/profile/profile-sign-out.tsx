"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileSignOut() {
  return (
    <Button
      type="button"
      variant="outline"
      className="mt-6 w-full sm:w-auto gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
      Sign out
    </Button>
  );
}
