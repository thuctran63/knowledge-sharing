"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  PenSquare,
  LogOut,
  User,
  Menu,
  X,
  Search,
  Home,
  Hash,
  Library,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

function MobileThemeMenuItem({ onDone }: { onDone: () => void }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
        onDone();
      }}
      className="flex md:hidden w-full items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} />
      )}
      {mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}
    </button>
  );
}

function MobileNavOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-x-0 bottom-0 top-16 z-[40] bg-black/50 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
      />

      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-x-0 top-16 z-[48] md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto",
          "border-b border-border/40 bg-background shadow-lg",
          "animate-in slide-in-from-top-2 fade-in-0 duration-200"
        )}
      >
        <div className="container py-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={onClose}
          >
            <Home className="h-4 w-4" strokeWidth={1.5} />
            Home
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={onClose}
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
            Search articles
          </Link>
          <Link
            href="/tags"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={onClose}
          >
            <Hash className="h-4 w-4" strokeWidth={1.5} />
            Browse by tags
          </Link>
          <MobileThemeMenuItem onDone={onClose} />
        </div>
      </nav>
    </>,
    document.body
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authLoading = status === "loading";

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40",
        mobileMenuOpen
          ? "bg-background"
          : "bg-background/80 backdrop-blur-xl backdrop-saturate-150"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-105">
              <BookOpen className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <span className="hidden sm:inline-block text-lg font-heading font-semibold tracking-tight">
              Knowledge
              <span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Explore
            </Link>
            <Link
              href="/tags"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Tags
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block w-56">
            <SearchBar />
          </div>

          <Link href="/search" className="sm:hidden">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </Link>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <NotificationBell />

          {authLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="hidden sm:block h-9 w-16 rounded-lg" />
              <Skeleton className="hidden sm:block h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-full sm:hidden" />
            </div>
          ) : session?.user ? (
            <div className="flex items-center gap-1">
              <Link href="/post/new" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <PenSquare className="h-4 w-4" />
                  Write
                </Button>
              </Link>
              <Link href="/post/new" className="sm:hidden">
                <Button variant="ghost" size="icon" aria-label="Write">
                  <PenSquare className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </Link>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <UserAvatar
                      src={session.user.image}
                      name={session.user.name}
                      size="sm"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 sm:w-64">
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <UserAvatar
                      src={session.user.image}
                      name={session.user.name}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href={`/profile/${session.user.id}`}>
                    <DropdownMenuItem className="cursor-pointer gap-2 min-h-[44px]">
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/drafts">
                    <DropdownMenuItem className="cursor-pointer gap-2 min-h-[44px]">
                      <Library className="h-4 w-4" />
                      Library
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive min-h-[44px]"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="hidden sm:flex">
                  Get started
                </Button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <MobileNavOverlay open={mobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}
