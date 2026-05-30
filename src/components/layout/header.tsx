"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Library } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();
  const authLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-105">
            <BookOpen className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <span className="text-base font-heading font-semibold tracking-tight sm:text-lg">
            Knowledge
            <span className="text-primary">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/search">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </Link>

          {authLoading ? (
            <>
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <ThemeToggle />
              <Skeleton className="h-9 w-9 rounded-full" />
            </>
          ) : session?.user ? (
            <>
              <Link href="/drafts">
                <Button variant="ghost" size="icon" aria-label="Library">
                  <Library className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </Link>

              <NotificationBell />

              <ThemeToggle />

              <Link
                href={`/profile/${session.user.id}`}
                className="relative ml-0.5 flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Profile"
              >
                <UserAvatar
                  src={session.user.image}
                  name={session.user.name}
                  size="sm"
                />
              </Link>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login" className="ml-1">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
