"use client";

import Link from "next/link";
import { PostFeed } from "@/components/post/post-feed";
import { Button } from "@/components/ui/button";
import type { PostCardData } from "@/types";
import { cn } from "@/lib/utils";

interface HomeFeedTabsProps {
  feed: "latest" | "following";
  latestPosts: PostCardData[];
  latestTotalPages: number;
  followingPosts: PostCardData[];
  followingTotalPages: number;
  userId: string | null;
}

export function HomeFeedTabs({
  feed,
  latestPosts,
  latestTotalPages,
  followingPosts,
  followingTotalPages,
  userId,
}: HomeFeedTabsProps) {
  const isFollowing = feed === "following";

  return (
    <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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

      {isFollowing && !userId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">
            Sign in to see articles from authors you follow.
          </p>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <PostFeed
          initialPosts={isFollowing ? followingPosts : latestPosts}
          initialPage={1}
          initialTotalPages={
            isFollowing ? followingTotalPages : latestTotalPages
          }
          sort="latest"
          feed={isFollowing ? "following" : "latest"}
          userId={userId}
          emptyMessage={
            isFollowing
              ? "No articles from people you follow yet. Explore and follow some authors!"
              : "No articles published yet."
          }
        />
      )}
    </section>
  );
}
