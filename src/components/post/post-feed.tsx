"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/post/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { PostCardData } from "@/types";

interface PostFeedProps {
  initialPosts: PostCardData[];
  initialNextCursor?: string | null;
  sort?: "latest" | "trending";
  feed?: "latest" | "following";
  tag?: string;
  userId?: string | null;
  emptyState?: {
    title: string;
    description: string;
    action?: { label: string; href: string };
  };
}

export function PostFeed({
  initialPosts,
  initialNextCursor = null,
  sort = "latest",
  feed = "latest",
  tag,
  userId,
  emptyState,
}: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosts(initialPosts);
    setNextCursor(initialNextCursor);
  }, [initialPosts, initialNextCursor, tag, sort, feed]);

  const loadMore = useCallback(async () => {
    if (loading || !nextCursor) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        cursor: nextCursor,
        limit: "10",
        sort,
      });
      if (feed === "following") params.set("feed", "following");
      if (tag) params.set("tag", tag);
      if (userId) params.set("userId", userId);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");

      const data = await res.json();
      const incoming = (data.data || []) as PostCardData[];

      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !ids.has(p.id))];
      });
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // keep current list on error
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, sort, feed, tag, userId]);

  if (posts.length === 0) {
    if (emptyState) {
      return (
        <EmptyState
          icon={FileText}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
        <p className="text-muted-foreground">No articles published yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
        >
          <PostCard post={post} />
        </div>
      ))}

      {nextCursor ? (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadMore()}
            disabled={loading}
            className="min-w-[140px] gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : posts.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground pt-4">
          No more articles
        </p>
      ) : null}
    </div>
  );
}
