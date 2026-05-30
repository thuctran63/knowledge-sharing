"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { PostFeed } from "@/components/post/post-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { PostCardData } from "@/types";

interface HomeFeedTabsProps {
  feed: "latest" | "following";
  latestPosts: PostCardData[];
  latestNextCursor: string | null;
  followingPosts: PostCardData[];
  followingNextCursor: string | null;
  userId: string | null;
}

export function HomeFeedTabs({
  feed,
  latestPosts,
  latestNextCursor,
  followingPosts,
  followingNextCursor,
  userId,
}: HomeFeedTabsProps) {
  const isFollowing = feed === "following";

  return (
    <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      {isFollowing && !userId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">
            Sign in to see articles from authors you follow.
          </p>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      ) : isFollowing && userId && followingPosts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Not following anyone yet"
          description="Follow authors you enjoy to see their new articles here."
          action={{ label: "Explore authors", href: "/tags" }}
        />
      ) : (
        <PostFeed
          initialPosts={isFollowing ? followingPosts : latestPosts}
          initialNextCursor={
            isFollowing ? followingNextCursor : latestNextCursor
          }
          sort="latest"
          feed={isFollowing ? "following" : "latest"}
          userId={userId}
          emptyState={
            isFollowing
              ? undefined
              : {
                  title: "No articles yet",
                  description:
                    "Be the first to share your knowledge with the community.",
                  action: { label: "Start writing", href: "/post/new" },
                }
          }
        />
      )}
    </section>
  );
}
