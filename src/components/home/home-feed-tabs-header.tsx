"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeFeedTabsHeaderProps {
  feed: "latest" | "following";
}

/** Same row height as trending sidebar header for grid alignment */
export function HomeFeedTabsHeader({ feed }: HomeFeedTabsHeaderProps) {
  const isFollowing = feed === "following";

  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-4">
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted/50 p-1">
        <Link
          href="/"
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            !isFollowing
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Latest
        </Link>
        <Link
          href="/?feed=following"
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isFollowing
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Following
        </Link>
      </div>

      {!isFollowing && (
        <Link
          href="/search?sort=latest"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          View all
        </Link>
      )}
    </div>
  );
}
