"use client";

import { useState } from "react";
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
  FilePen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
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

          <ThemeToggle />

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
                      <FilePen className="h-4 w-4" />
                      My articles
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

      <div
        className={cn(
          "md:hidden fixed inset-x-0 top-16 z-40 border-b border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-200 overflow-hidden",
          mobileMenuOpen ? "max-h-80" : "max-h-0"
        )}
      >
        <div className="container py-4 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home className="h-4 w-4" strokeWidth={1.5} />
            Home
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
            Search articles
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Hash className="h-4 w-4" strokeWidth={1.5} />
            Browse by tags
          </Link>
          {authLoading ? null : session?.user ? (
            <>
              <div className="border-t border-border/40 my-2" />
              <Link
                href="/post/new"
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <PenSquare className="h-4 w-4" strokeWidth={1.5} />
                Write article
              </Link>
              <Link
                href={`/profile/${session.user.id}`}
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                Profile
              </Link>
              <Link
                href="/drafts"
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FilePen className="h-4 w-4" strokeWidth={1.5} />
                My articles
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 min-h-[44px] w-full px-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
